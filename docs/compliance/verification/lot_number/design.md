# Design for lot_number

```mermaid
%%{init: { "sequence": { "mirrorActors": false } }}%%
sequenceDiagram
    participant be as Backend
    participant db as Database

    be ->> db : get lot number
    db -->> be : lot number data

    alt lot number is null or lot number is empty
        be ->> be : return invalid verification result
    else
        be ->> be : return valid verification result
    end
```
