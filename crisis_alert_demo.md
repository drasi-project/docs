QUERY


MATCH (e:Employee)-[:assigned_to]->(t:Team),(m:Employee)-[:manages]->(t:Team),(e:Employee)-[:located_in]->(:Building)-[:located_in]->(r:Region),(i:Incident)-[:occurs_in]->(r:Region) WHERE i.severity = "critical" AND e.name <> m.name RETURN m.name AS ManagerName, m.email AS ManagerEmail, e.name AS EmployeeName, i.description AS IncidentDescription



mutation addCrisisAlertQuery($crisisAlertQuery: ContinuousQueryInput!) {
  addContinuousQuery(continuousQuery: $crisisAlertQuery) {
    id name query materialize
  } 
}

{
  "crisisAlertQuery": {
    "name": "Crisis Alert",
    "db": "Contoso.HumanResources",
    "query": "MATCH (e:Employee)-[:assigned_to]->(t:Team),(m:Employee)-[:manages]->(t:Team),(e:Employee)-[:located_in]->(:Building)-[:located_in]->(r:Region),(i:Incident)-[:occurs_in]->(r:Region) WHERE i.severity = \"critical\" AND e.name <> m.name RETURN m.name AS ManagerName, m.email AS ManagerEmail, e.name AS EmployeeName, i.description AS IncidentDescription",
    "materialize": true,
    "subscriptions": [{
      "name" : "Crisis Alert",
      "reactions": [{
      	"type": "file",
        "fileReactionConfig": {
          "batchOutput": false,
          "fileName": "crisis_alert_demo"
        }
      },{
      	"type": "sendGrid",
        "sendGridReactionConfig": {
          "templateId": "d-bfda3e69eaad4d81b262ece093311df8",
          "emailFromAddress": "alljones@microsoft.com",
          "emailToAddress": "$ManagerEmail"
        }      
      }]
    }]
  }
}



ADD ANOTHER EMPLOYEE
g.addV('Employee').property('id', 'anya').property('name', 'Anya').property('gender', 'Female').property('email', 'alljones@microsoft.com')

g.V('anya').addE('assigned_to').to(g.V('azinc'))

g.V('anya').addE('located_in').to(g.V('allens_house'))

