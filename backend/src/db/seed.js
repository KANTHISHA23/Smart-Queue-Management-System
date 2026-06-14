/**
 * Database Seed Script — PostgreSQL / Neon version
 * Populates Hazaribagh, Jharkhand locations, queues, and realistic demo tokens.
 */
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { hazaribaghLocations } = require('./data/hazaribagh-locations');

function findQueue(queues, locationKey, queueName) {
  const match = queues.find((q) => q.location_key === locationKey && q.name === queueName);
  if (!match) {
    throw new Error(`Queue not found: ${locationKey} / ${queueName}`);
  }
  return match;
}

function formatTokenNumber(prefix, number) {
  return `${prefix}${String(number).padStart(3, '0')}`;
}

async function seed() {
  const client = await pool.connect();

  try {
    console.log('Seeding database (Hazaribagh, Jharkhand only)...\n');
    await client.query('BEGIN');

    await client.query(`
      TRUNCATE TABLE notifications, tokens, queues, locations, organizations, users
      RESTART IDENTITY CASCADE
    `);
    console.log('  Cleared existing data');

    const hashedPassword = await bcrypt.hash('password123', 12);

    const userRows = [
      ['Admin User', 'admin@smartqueue.com', '+91 98765 43210', 'admin'],
      ['Dr. Rajesh Kumar', 'sarah@hospital.com', '+91 6546-267456', 'admin'],
      ['Priya Devi', 'john@example.com', '+91 94310-11234', 'user'],
      ['Md. Imran Ansari', 'jane@example.com', '+91 94311-22345', 'user'],
      ['Ram Bilas Yadav', 'mike@example.com', '+91 94312-33456', 'user'],
      ['Shyam Sundar Singh', 'emily@example.com', '+91 94313-44567', 'user'],
      ['Kavita Jaiswal', 'robert@example.com', '+91 94314-55678', 'user'],
      ['Vikash Ram', 'lisa@example.com', '+91 94315-66789', 'user'],
    ];

    const insertedUsers = [];
    for (const [name, email, phone, role] of userRows) {
      const result = await client.query(
        `INSERT INTO users (name, email, password_hash, phone, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, email, role`,
        [name, email, hashedPassword, phone, role]
      );
      insertedUsers.push(result.rows[0]);
    }
    console.log(`  Created ${insertedUsers.length} users`);

    const orgRows = [
      ['Default Organization', 'default@smartqueue.local', '__NO_LOGIN__', 'default'],
      ['Hazaribagh Hospital Services', 'hospital@provider.com', hashedPassword, 'hospital'],
      ['Jharkhand Clinic Network', 'healthfirst@provider.com', hashedPassword, 'clinic'],
      ['Hazaribagh Govt Services', 'govserv@provider.com', hashedPassword, 'government'],
    ];

    const insertedOrgs = [];
    for (const row of orgRows) {
      const result = await client.query(
        `INSERT INTO organizations (name, email, password_hash, type)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email`,
        row
      );
      insertedOrgs.push(result.rows[0]);
    }
    console.log(`  Created ${insertedOrgs.length - 1} provider organizations`);

    const orgByEmail = Object.fromEntries(insertedOrgs.map((org) => [org.email, org.id]));
    const defaultOrgId = orgByEmail['default@smartqueue.local'];
    const hospitalOrgId = orgByEmail['hospital@provider.com'] || defaultOrgId;
    const healthOrgId = orgByEmail['healthfirst@provider.com'] || defaultOrgId;
    const govOrgId = orgByEmail['govserv@provider.com'] || defaultOrgId;

    const orgEmailForType = (type, loc) => {
      if (loc.organizationEmail) return orgByEmail[loc.organizationEmail] || defaultOrgId;
      if (type === 'hospital') return hospitalOrgId;
      if (type === 'clinic') return healthOrgId;
      if (type === 'government') return govOrgId;
      if (type === 'bank') return defaultOrgId;
      return defaultOrgId;
    };

    const insertedLocations = [];
    const locationOrgMap = new Map();

    for (const loc of hazaribaghLocations) {
      const result = await client.query(
        `INSERT INTO locations (
           name, type, description, address, city, state, zip_code, phone, email,
           operating_hours, reviews, admin_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12)
         RETURNING id, name`,
        [
          loc.name,
          loc.type,
          loc.description,
          loc.address,
          loc.city,
          loc.state,
          loc.zip_code,
          loc.phone,
          loc.email,
          JSON.stringify(loc.operating_hours),
          JSON.stringify(loc.reviews || []),
          insertedUsers[0].id,
        ]
      );
      insertedLocations.push({ ...result.rows[0], key: loc.key });
      locationOrgMap.set(result.rows[0].id, orgEmailForType(loc.type, loc));
    }
    console.log(`  Created ${insertedLocations.length} Hazaribagh, Jharkhand locations`);

    const insertedQueues = [];
    for (let i = 0; i < hazaribaghLocations.length; i += 1) {
      const loc = hazaribaghLocations[i];
      const locationId = insertedLocations[i].id;
      const orgId = locationOrgMap.get(locationId);

      for (const queue of loc.queues) {
        const result = await client.query(
          `INSERT INTO queues (location_id, organization_id, name, description, prefix, current_number, now_serving, avg_service_time, status, max_capacity)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id, name, status, prefix`,
          [
            locationId,
            orgId,
            queue.name,
            queue.description,
            queue.prefix,
            0,
            0,
            queue.avg_service_time,
            queue.status || 'active',
            100,
          ]
        );
        insertedQueues.push({
          ...result.rows[0],
          location_key: loc.key,
          location_name: loc.name,
          avg_service_time: queue.avg_service_time,
        });
      }
    }
    console.log(
      `  Created ${insertedQueues.length} queues (${insertedQueues.filter((queue) => queue.status === 'active').length} active)`
    );

    const queueCounters = new Map();
    const bumpQueueCounter = (queueId, usedNumber) => {
      const current = queueCounters.get(queueId) || 0;
      queueCounters.set(queueId, Math.max(current, usedNumber));
    };

    const insertLiveToken = async ({
      queue,
      tokenNumber,
      userId,
      status,
      position,
      priority = 'normal',
      bookedAt,
      calledAt = null,
      completedAt = null,
      estimatedWait = 0,
    }) => {
      await client.query(
        `INSERT INTO tokens (
           token_number, queue_id, user_id, status, position, priority_level,
           booked_at, called_at, completed_at, estimated_wait, prediction_source
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ml')`,
        [
          tokenNumber,
          queue.id,
          userId,
          status,
          position,
          priority,
          bookedAt,
          calledAt,
          completedAt,
          estimatedWait,
        ]
      );
      const numeric = parseInt(tokenNumber.replace(/\D/g, ''), 10) || 0;
      bumpQueueCounter(queue.id, numeric);
    };

    let tokenCount = 0;
    const sadarOpd = findQueue(insertedQueues, 'sadar-hospital', 'General OPD');

    for (let i = 1; i <= 10; i += 1) {
      const status = i <= 6 ? 'completed' : i === 7 ? 'serving' : 'waiting';
      const userId = insertedUsers[((i - 1) % 6) + 2].id;
      const bookedAt = new Date(Date.now() - (11 - i) * 12 * 60000).toISOString();
      const calledAt = status !== 'waiting' ? new Date(Date.now() - (10 - i) * 10 * 60000).toISOString() : null;
      const completedAt =
        status === 'completed'
          ? new Date(Date.now() - (10 - i) * 10 * 60000 + 8 * 60000).toISOString()
          : null;

      await insertLiveToken({
        queue: sadarOpd,
        tokenNumber: formatTokenNumber('G', i),
        userId,
        status,
        position: i,
        priority: i === 2 ? 'priority' : 'normal',
        bookedAt,
        calledAt,
        completedAt,
        estimatedWait: status === 'waiting' ? (i - 7) * 10 : 0,
      });
      tokenCount += 1;
    }

    const liveScenarios = [
      {
        locationKey: 'sadar-hospital',
        queueName: 'Emergency',
        tokens: [
          { n: 1, status: 'waiting', userIdx: 3, position: 1, wait: 18 },
          { n: 2, status: 'waiting', userIdx: 4, position: 2, wait: 36, priority: 'emergency' },
        ],
      },
      {
        locationKey: 'canning-hospital',
        queueName: 'General Consultation',
        tokens: [
          { n: 1, status: 'completed', userIdx: 3 },
          { n: 2, status: 'serving', userIdx: 4, position: 2 },
          { n: 3, status: 'waiting', userIdx: 5, position: 3, wait: 24 },
        ],
      },
      {
        locationKey: 'esi-hospital',
        queueName: 'ESI OPD',
        tokens: [
          { n: 1, status: 'waiting', userIdx: 5, position: 1, wait: 14 },
          { n: 2, status: 'waiting', userIdx: 6, position: 2, wait: 28 },
        ],
      },
      {
        locationKey: 'sbi-hazaribagh',
        queueName: 'Account Services',
        tokens: [
          { n: 1, status: 'completed', userIdx: 6 },
          { n: 2, status: 'waiting', userIdx: 7, position: 1, wait: 18 },
        ],
      },
      {
        locationKey: 'collectorate',
        queueName: 'Revenue & Certificate Counter',
        tokens: [{ n: 1, status: 'waiting', userIdx: 7, position: 1, wait: 15 }],
      },
      {
        locationKey: 'rto-hazaribagh',
        queueName: 'Driving Licence Counter',
        tokens: [
          { n: 1, status: 'completed', userIdx: 4 },
          { n: 2, status: 'waiting', userIdx: 5, position: 1, wait: 25 },
        ],
      },
    ];

    for (const scenario of liveScenarios) {
      const queue = findQueue(insertedQueues, scenario.locationKey, scenario.queueName);
      for (const token of scenario.tokens) {
        const bookedAt = new Date(Date.now() - token.n * 18 * 60000).toISOString();
        const calledAt =
          token.status !== 'waiting'
            ? new Date(Date.now() - token.n * 14 * 60000).toISOString()
            : null;
        const completedAt =
          token.status === 'completed'
            ? new Date(Date.now() - token.n * 12 * 60000).toISOString()
            : null;

        await insertLiveToken({
          queue,
          tokenNumber: formatTokenNumber(queue.prefix, token.n),
          userId: insertedUsers[token.userIdx].id,
          status: token.status,
          position: token.position ?? token.n,
          priority: token.priority || 'normal',
          bookedAt,
          calledAt,
          completedAt,
          estimatedWait: token.wait ?? 0,
        });
        tokenCount += 1;
      }
    }
    console.log(`  Created ${tokenCount} live demo tokens across Hazaribagh queues`);

    const activeQueues = insertedQueues.filter((item) => item.status === 'active');
    const priorities = ['normal', 'normal', 'normal', 'priority', 'emergency'];
    const historyRows = [];

    for (const queue of activeQueues) {
      const avgService = queue.avg_service_time || 8;
      const startNumber = (queueCounters.get(queue.id) || 0) + 1;

      for (let day = 7; day >= 1; day -= 1) {
        for (const hour of [8, 11, 14, 17]) {
          for (let slot = 0; slot < 2; slot += 1) {
            const tokenSeq = startNumber + historyRows.filter((row) => row[1] === queue.id).length;
            const userId = insertedUsers[(tokenSeq % 6) + 2].id;
            const position = 1 + (slot % 6);
            const priority = priorities[tokenSeq % priorities.length];
            const waitMultiplier = priority === 'emergency' ? 0.6 : priority === 'priority' ? 0.8 : 1;
            const bookedAt = new Date();
            bookedAt.setDate(bookedAt.getDate() - day);
            bookedAt.setHours(hour, (slot * 17) % 60, 0, 0);

            const queueWaitMinutes = Math.max(
              3,
              Math.round(position * avgService * waitMultiplier + (slot % 4))
            );
            const calledAt = new Date(bookedAt.getTime() + queueWaitMinutes * 60000);
            const serviceMinutes = Math.max(2, Math.round(avgService + ((slot + hour) % 5) - 2));
            const completedAt = new Date(calledAt.getTime() + serviceMinutes * 60000);
            const tokenNumber = formatTokenNumber(queue.prefix, tokenSeq);

            historyRows.push([
              tokenNumber,
              queue.id,
              userId,
              'completed',
              position,
              priority,
              bookedAt.toISOString(),
              calledAt.toISOString(),
              completedAt.toISOString(),
              queueWaitMinutes,
              serviceMinutes,
            ]);
            bumpQueueCounter(queue.id, tokenSeq);
          }
        }
      }
    }

    const batchSize = 50;
    for (let i = 0; i < historyRows.length; i += batchSize) {
      const batch = historyRows.slice(i, i + batchSize);
      const values = [];
      const params = [];
      batch.forEach((row, idx) => {
        const base = idx * 11;
        values.push(
          `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, 'heuristic')`
        );
        params.push(...row);
      });
      await client.query(
        `INSERT INTO tokens (
           token_number, queue_id, user_id, status, position, priority_level,
           booked_at, called_at, completed_at, estimated_wait, service_time, prediction_source
         ) VALUES ${values.join(', ')}`,
        params
      );
    }
    console.log(`  Created ${historyRows.length} historical tokens (real queue prefixes, for ML training)`);

    for (const queue of insertedQueues) {
      const current = queueCounters.get(queue.id) || 0;
      await client.query(`UPDATE queues SET current_number = $1 WHERE id = $2`, [current, queue.id]);
    }

    const notificationRows = [
      [
        insertedUsers[2].id,
        'Token Booked',
        'Your token G008 has been booked for General OPD at District Sadar Hospital, Hazaribagh.',
        'success',
        true,
      ],
      [
        insertedUsers[2].id,
        'Queue Update',
        'You are now at position 2 in the General OPD queue. Estimated wait: 20 minutes.',
        'queue_update',
        true,
      ],
      [
        insertedUsers[2].id,
        'Turn Approaching',
        'Your turn is approaching! You are next in line at Sadar Hospital OPD.',
        'turn_approaching',
        false,
      ],
      [
        insertedUsers[3].id,
        'Token Booked',
        'Your token C003 has been booked for General Consultation at Canning Hospital, Matwari.',
        'success',
        true,
      ],
      [
        insertedUsers[6].id,
        'Token Booked',
        'Your token A002 is waiting at State Bank of India, Gorakh Nath Chowk, Hazaribagh.',
        'success',
        false,
      ],
    ];

    for (const row of notificationRows) {
      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, is_read)
         VALUES ($1, $2, $3, $4, $5)`,
        row
      );
    }
    console.log('  Created sample notifications');

    await client.query('COMMIT');

    console.log('\nDatabase seeded successfully!');
    console.log('\nDemo Credentials:');
    console.log('  Admin:    admin@smartqueue.com / password123');
    console.log('  User:     john@example.com / password123  (Priya Devi)');
    console.log('  Provider: hospital@provider.com / password123');
    console.log('  Provider: healthfirst@provider.com / password123');
    console.log('  Provider: govserv@provider.com / password123');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\nSeeding failed:', error.message);
    console.error(error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seed()
    .then(async () => {
      await pool.end();
    })
    .catch(async () => {
      await pool.end();
      process.exit(1);
    });
}

module.exports = {
  seed,
};
