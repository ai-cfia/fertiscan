# Flowchart for launching

## /label-data-validation

```mermaid
flowchart TD
    LabelDataValidation(["/label-data-validation"]) --> ImagesInStore{Images in store?}
    ImagesInStore -->|No| HomePage[Home] --> End([End])
    ImagesInStore -->|Yes| DisplayStoredImages["Display stored images"] --> LabelDataInStore{Label Data in store?}
    LabelDataInStore -->|No| GetExtract[GET /extract]
    LabelDataInStore -->|Yes| DisplayData[Display Data]
    GetExtract --> Success{Success?}
    Success -->|No| End
    Success -->|Yes| PostInspections[POST /inspections]
    PostInspections --> SaveSuccess{Success?}
    SaveSuccess -->|Yes| LabelDataWithID["go /label-data-validation/id"] --> End
    SaveSuccess -->|No| DisplayData --> End
```

## /label-data-validation/id

```mermaid
flowchart TD
    Start([Start]) --> LabelDataValidationID["/label-data-validation/id"]

    %% Parallel branches
    LabelDataValidationID --> ImagesUploaded{Images Uploaded?}
    LabelDataValidationID --> FetchInspections[GET /inspections/id]

    %% Image handling branch
    ImagesUploaded -->|No| End([End])
    ImagesUploaded -->|Yes| DisplayUploadedImages["Display Uploaded Images"] --> End

    %% Inspection handling branch
    FetchInspections --> FetchSuccess{Success?}
    FetchSuccess -->|No| ErrorPage["Display Error Page"] --> End
    FetchSuccess -->|Yes| UpdateValidationProgress["Update Validation Progress from Cookies"] --> DisplayData["Display Data"] --> End
```
