// Poll only data that changes during an event. Reference data stays fresh longer.
export function queryPolicy(path: string) {
  const resource = path.split("?")[0];
  if (["/portal/summary/", "/admin/dashboard/", "/seasons/access/", "/attendance/daily/"].includes(resource)
      || resource === "/admin/attendance/" || resource === "/competitions/") {
    return { staleTime: 15000, refetchInterval: 30000 };
  }
  if (resource === "/events/" || resource === "/portal/attendance-overview/") {
    return { staleTime: 30000, refetchInterval: 60000 };
  }
  if (resource.endsWith("/filter-options/") || resource === "/admin/field-limits/"
      || resource === "/events/categories/" || resource === "/admin/settings/") {
    return { staleTime: 300000, refetchInterval: false as const };
  }
  return { staleTime: 60000, refetchInterval: false as const };
}

export function mutationResources(path: string): string[] {
  const resource = path.split("?")[0];
  if (resource.startsWith("/seasons/") && !resource.endsWith("/export/")) {
    // Switching seasons changes every operational scope, including cached pages.
    return ["/", "dashboard-team-showcase"];
  }
  const affected: Record<string, string[]> = {
    "/events/": ["/events/", "/competitions/", "/portal/", "/admin/dashboard/", "/admin/attendance/", "/attendance/daily/", "dashboard-team-showcase"],
    "/admin/attendance/": ["/admin/attendance/", "/admin/points/", "/admin/houses/", "/admin/dashboard/", "/portal/", "/events/", "/attendance/daily/"],
    "/attendance/daily/": ["/admin/attendance/", "/admin/points/", "/admin/houses/", "/admin/dashboard/", "/portal/", "/events/", "/attendance/daily/"],
    "/admin/points/": ["/admin/points/", "/admin/houses/", "/admin/dashboard/", "/portal/summary/", "/portal/merit/", "/portal/attendance-overview/"],
    "/admin/results/": ["/admin/results/", "/admin/points/", "/admin/houses/", "/admin/dashboard/", "/portal/", "/competitions/", "/admin/matchups/"],
    "/admin/matchups/": ["/admin/matchups/", "/competitions/", "/events/", "/admin/results/", "/admin/points/", "/admin/houses/", "/admin/dashboard/", "/portal/", "dashboard-team-showcase"],
    "/admin/users/": ["/admin/users/", "/admin/roster/", "/admin/tickets/", "/admin/houses/", "/admin/dashboard/", "/portal/", "/admin/attendance/", "/seasons/access/"],
    "/admin/roster/": ["/admin/roster/", "/admin/users/", "/admin/tickets/", "/seasons/access/"],
    "/admin/tickets/": ["/admin/tickets/", "/admin/roster/", "/admin/users/", "/seasons/access/"],
    "/admin/houses/": ["/admin/houses/", "/houses/", "/admin/users/filter-options/", "/portal/summary/", "/admin/dashboard/", "/events/", "/competitions/", "dashboard-team-showcase"],
    "/admin/settings/": ["/admin/settings/", "/portal/summary/"],
    "/seasons/": ["/seasons/"],
  };
  const match = Object.keys(affected).find(prefix => resource.startsWith(prefix));
  return [...(match ? affected[match] : [resource.replace(/\d+\/.*$/, "")]), "/admin/audit/"];
}

export function queryAffected(key: readonly unknown[], resources: string[]) {
  return typeof key[0] === "string" && resources.some(prefix => (key[0] as string).startsWith(prefix));
}
