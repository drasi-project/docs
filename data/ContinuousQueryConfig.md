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
        keys [
          { label:<string>, propertyName: <string> }
        ]
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
- ChangeEvent Params (those starting with rg*) can only be used in the WHERE and RESULT clauses, not the MATCH clause. This is because the predicates in the match clause must be constant in order for the features to be calculated.
- For join to work, must define a join and then define a path that connects the paths from different sources
- A match path can only contain elements from a single source.
- If the same identifier is used multiple times in a match clause it must have the same type and constraints/predicates. The presence of repeated identifiers is how the anchor path approach jumps from one match path to another to solve the entire match clause. if the different occurances have different types or predicates it will create inconsistencies and likely incorrect results.
- Currently, aggregates must be last in the projection, do not automatically reorder
- Query author should push element specific constraints into the match clause where possible, this will reduce memory usage and improve perf. We could do some query analysis/rewriting in the future but not for now.