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