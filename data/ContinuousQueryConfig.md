```
{
  id: "<string>",
  name: "<string>",
  mode: "<query | filter>",
  sources: {
    subscriptions: [
      {
        id: "Contoso.PhysicalOperations",
        nodes: [
          { sourceLabel: "<string>", querylabel: "<string>" },
        ],
        relations: [
          { sourceLabel: "<string>", querylabel: "<string>" },
        ]
      },
      {
        id: "Contoso.RetailOperations",
        nodes: [
          { sourceLabel: "<string>", querylabel: "<string>" },
        ],
        relations: [
          { sourceLabel: "<string>", querylabel: "<string>" },
        ]
      }
    ],
    joins: [
      {
        id: "<string - query relation name>",
        start: "<string - source>:<string - type>:<string - prop>",
        end: "<string - source>:<string - type>:<string - prop>"
      }
    ]  
  },
  params: {},
  query: "<string>",
  subscriptions: []
}
```

Notes
- if there are more than 1 source subscription, all labels used in the query must be explicitly assigned to a source. if there is a single source, any elements that do not need aliases can be ignored and they will be automaically assigned to that source.
- Params can only be used in the WHERE and RESULT clauses, not the MATCH clause
- For join to work, must define a join and then define a path that connects the 