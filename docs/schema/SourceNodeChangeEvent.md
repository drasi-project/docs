```
{
  id: "<string>",
  sourceId: "<string>",
  type: "< i | u | d >,
  elementType: "< node | rel >",
  time: {
    seq: <long>,
    ms: <long>
  },
  before: {
    type: "< node | rel >",
    id: "<string>",
    labels: ["<string>"],
    startId: "<string>",
    endId: "<string>",
    properties: {}    
  },
  after: {
    type: "< node | rel >",
    id: "<string>",
    labels: ["<string>"],
    startId: "<string>",
    endId: "<string>",
    properties: {}    
  },
  metadata: {
    changeEvent,
    tracking: {
      source: {
        seq: change.sequenceNumber,
        reactivator_ms: changeEvent.ts_ms,
        enqueued_ms: Date.parse(change.enqueuedTimeUtc),
        changeSvcStart_ms:changeSvcStart,
        changeSvcEnd_ms: Date.now()
      }
    }
  }
}
```

    