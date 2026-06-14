/**
 * Location service
 */
const locationRepository = require('../repositories/location.repository');

async function getLocations(queryParams) {
  const { type, city, search, page = 1, limit = 12 } = queryParams;
  const offset = (page - 1) * limit;
  const conditions = ['l.is_active = true'];
  const params = [];
  let paramCount = 0;

  if (type) {
    paramCount++;
    conditions.push(`l.type = $${paramCount}`);
    params.push(type);
  }
  if (city) {
    paramCount++;
    conditions.push(`l.city LIKE $${paramCount}`);
    params.push(`%${city}%`);
  }
  if (search) {
    paramCount++;
    conditions.push(`(l.name LIKE $${paramCount} OR l.description LIKE $${paramCount})`);
    params.push(`%${search}%`);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const countResult = await locationRepository.countWithFilters(whereClause, params);
  const total = parseInt(countResult.rows[0].count, 10);

  const listParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
  const result = await locationRepository.findManyWithQueueStats(whereClause, listParams);

  return {
    ok: true,
    data: {
      locations: result.rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit),
      },
    },
  };
}

async function getLocationById(id) {
  const locationResult = await locationRepository.findByIdWithAdmin(id);
  if (locationResult.rows.length === 0) {
    return { ok: false, status: 404, message: 'Location not found.' };
  }

  const queuesResult = await locationRepository.findQueuesWithStatsByLocationId(id);
  return {
    ok: true,
    data: {
      location: locationResult.rows[0],
      queues: queuesResult.rows,
    },
  };
}

async function createLocation(body, adminUserId) {
  const {
    name,
    type,
    description,
    address,
    city,
    state,
    zip_code,
    phone,
    email,
    image_url,
    operating_hours,
  } = body;

  const result = await locationRepository.insert({
    name,
    type,
    description,
    address,
    city,
    state,
    zip_code,
    phone,
    email,
    image_url,
    operating_hours: JSON.stringify(
      operating_hours || { open: '09:00', close: '17:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] }
    ),
    admin_id: adminUserId,
  });

  return { ok: true, status: 201, message: 'Location created successfully.', data: result.rows[0] };
}

async function updateLocation(id, body) {
  const {
    name,
    type,
    description,
    address,
    city,
    state,
    zip_code,
    phone,
    email,
    image_url,
    operating_hours,
    is_active,
  } = body;

  const result = await locationRepository.updateById(id, {
    name,
    type,
    description,
    address,
    city,
    state,
    zip_code,
    phone,
    email,
    image_url,
    operating_hours: operating_hours ? JSON.stringify(operating_hours) : null,
    is_active,
  });

  if (result.rows.length === 0) {
    return { ok: false, status: 404, message: 'Location not found.' };
  }

  return { ok: true, message: 'Location updated successfully.', data: result.rows[0] };
}

async function deleteLocation(id) {
  const existing = await locationRepository.findSummaryById(id);
  if (existing.rows.length === 0) {
    return { ok: false, status: 404, message: 'Location not found.' };
  }

  await locationRepository.deleteById(id);
  return {
    ok: true,
    message: `Location "${existing.rows[0].name}" deleted successfully.`,
  };
}

module.exports = {
  getLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
};
