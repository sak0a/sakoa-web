import { recordAdminAudit } from '../../repositories/audit.js';
import {
  createDonor,
  deleteDonor,
  listDonors,
  updateDonor
} from '../../repositories/donors.js';
import { adminSessionFingerprint } from '../../utils/admin-session.js';
import { clearCache } from '../../utils/cache.js';

async function audit(event, action, target, outcome, metadata = null) {
  try {
    await recordAdminAudit({
      actor: adminSessionFingerprint(event.context.adminSession),
      action,
      target,
      outcome,
      metadata
    });
  } catch (error) {
    // The requested mutation has already committed. Audit storage failure must
    // never turn a successful operation into a misleading HTTP 500 response.
    console.error('Could not record donor audit event', { action, message: error?.message });
  }
}

function resultError(result) {
  throw createError({
    statusCode: result.missing ? 404 : result.conflict ? 409 : 400,
    statusMessage: result.errors.join(', ')
  });
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event).toUpperCase();
  const actor = adminSessionFingerprint(event.context.adminSession);

  if (method === 'GET') {
    return { success: true, donors: await listDonors() };
  }

  if (method === 'POST') {
    const body = await readBody(event);
    const result = await createDonor(body?.donor, actor);
    if (!result.success) resultError(result);

    clearCache('donors_list');
    await audit(event, 'donor.create', result.data.steamid, 'success');
    setResponseStatus(event, 201);
    return { success: true, message: 'Donor added successfully', donor: result.data };
  }

  if (method === 'PUT') {
    const body = await readBody(event);
    const result = await updateDonor(body?.steamid, body?.donor, actor);
    if (!result.success) resultError(result);

    clearCache('donors_list');
    await audit(event, 'donor.update', result.data.steamid, 'success');
    return { success: true, message: 'Donor updated successfully', donor: result.data };
  }

  if (method === 'DELETE') {
    const result = await deleteDonor(String(getQuery(event).steamid || ''));
    if (!result.success) resultError(result);

    clearCache('donors_list');
    await audit(event, 'donor.delete', result.data.steamid, 'success');
    return { success: true, message: 'Donor deleted successfully', deletedDonor: result.data };
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
