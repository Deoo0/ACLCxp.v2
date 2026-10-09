import assert from 'node:assert/strict';
import { QueryClient } from '@tanstack/react-query';
import { queryPolicy, mutationResources, queryAffected } from '../src/services/queryPolicy.ts';

assert.equal(queryPolicy('/admin/settings/?page=1').refetchInterval, false);
assert.equal(queryPolicy('/admin/users/filter-options/').staleTime, 300000);
assert.equal(queryPolicy('/portal/summary/').refetchInterval, 30000);
assert.equal(queryPolicy('/seasons/access/').refetchInterval, 30000);
assert.equal(queryPolicy('/events/?page=2').refetchInterval, 60000);
assert.equal(queryPolicy('/admin/roster/').refetchInterval, false);

const client = new QueryClient();
const paths = ['/portal/summary/', '/admin/settings/', '/events/?page=1', '/events/12/', '/admin/tickets/?page=3', '/seasons/access/', '/admin/audit/?page=2', 'dashboard-team-showcase'];
for (const path of paths) client.setQueryData([path], { cached: true });
await client.invalidateQueries({ predicate: query => queryAffected(query.queryKey, mutationResources('/admin/settings/5/')) });
assert.equal(client.getQueryState(['/portal/summary/']).isInvalidated, true);
assert.equal(client.getQueryState(['/admin/audit/?page=2']).isInvalidated, true);
assert.equal(client.getQueryState(['/events/?page=1']).isInvalidated, false);
assert.equal(client.getQueryState(['/admin/tickets/?page=3']).isInvalidated, false);
assert(queryAffected(['/events/12/'], mutationResources('/events/12/register/')));
assert(queryAffected(['dashboard-team-showcase'], mutationResources('/events/12/')));
assert(queryAffected(['/seasons/access/'], mutationResources('/admin/tickets/4/')));
assert(queryAffected(['/portal/summary/'], mutationResources('/admin/attendance/3/correct/')));
assert(!queryAffected(['/events/'], mutationResources('/seasons/1/export/')));
assert(queryAffected(['/admin/tickets/?page=3'], mutationResources('/seasons/1/transition/')));
client.clear();
console.log('PASS: refresh policies and targeted cache invalidation, including season lifecycle scope changes.');
