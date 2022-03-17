``` mermaid
sequenceDiagram
  actor CS as ChangeSource
  participant DBi as DBi
  participant DBu as DBu
  participant DBb as DBb
  participant DBc as DBc
  participant RGS as RGS
  participant L as Change Log
  participant Q as Query Execution
  participant R as Reaction Execution
  activate DBi
  CS-)DBi: update (U)
  DBi->>DBu: commit
  DBi-)L: change (C)
  deactivate DBi
  activate DBu

  S-)DBa: update (Ub)
  DBa->>DBb: commit 
  deactivate DBu
  activate DBb

  S-)DBb: update (Uc)
  DBb->>DBc: commit 
  deactivate DBb
  activate DBc

  S-)DBc: update (Um)
  DBc->>DBm: commit 
  deactivate DBc
  activate DBm

  S-)DBm: update (Um)
  DBm->>DBn: commit 
  deactivate DBm
  activate DBn


```