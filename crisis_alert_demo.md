QUERY


MATCH (e:Employee)-[:assigned_to]->(t:Team),(m:Employee)-[:manages]->(t:Team),(e:Employee)-[:located_in]->(:Building)-[:located_in]->(r:Region),(i:Incident)-[:occurs_in]->(r:Region) WHERE i.severity = "critical" AND e.name <> m.name RETURN m.name AS ManagerName, m.email AS ManagerEmail, e.name AS EmployeeName, i.description AS IncidentDescription