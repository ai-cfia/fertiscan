# Flowcharts

## Launch /label-data-confirmation

```mermaid
flowchart TD
    Start([Start]) --> LabelDataConfirmation["/label-data-confirmation"]
    LabelDataConfirmation --> ImagesCheck{"Images in store?"}
    ImagesCheck -->|No| HomePage[Home]
    ImagesCheck -->|Yes| LabelDataCheck{"Label Data in store?"}
    LabelDataCheck -->|No| HomePage
    LabelDataCheck -->|Yes| LabelDataConfirmed{"Label Data already confirmed?"}
    LabelDataConfirmed -->|Yes| HomePage
    LabelDataConfirmed -->|No| FieldsVerified{"All fields verified?"}
    FieldsVerified -->|No| HomePage
    FieldsVerified -->|Yes| DisplayImages["Display Images"] --> DisplayLabelData["Display Label Data"] --> End([End])
    HomePage --> End
```

## Click on Confirm button

```mermaid
flowchart TD
    Start([Confirm Button Clicked]) --> CheckConfirmationCheckbox{"Confirmation Checkbox Checked?"}
    CheckConfirmationCheckbox -->|No| End([End])
    CheckConfirmationCheckbox -->|Yes| CheckInspectionID{"labelData.inspection_id?"}

    CheckInspectionID -->|No| StartLoadingAnimationNoID["Start Loading Animation"]
    StartLoadingAnimationNoID --> PostRequest["POST api/inspections with LabelData"]
    PostRequest --> PostRequestSuccess{"Request Success?"}
    PostRequestSuccess -->|No| StopLoadingFailure["Stop Loading Animation"] --> DisplayFailureAlert["Display Failure Alert"] --> End
    PostRequestSuccess -->|Yes| StoreInspectionID["Store Inspection ID"] --> CopyLabelData["Copy Label Data and Set confirmed = true"] --> StartLoadingAnimationWithID["Start Loading Animation"] --> PutRequest["PUT api/inspections/inspection_id with LabelData"]

    CheckInspectionID -->|Yes| CopyLabelData
    PutRequest --> PutRequestSuccess{"Request Success?"}
    PutRequestSuccess -->|No| StopLoadingFailure
    PutRequestSuccess -->|Yes| StopLoadingSuccess["Stop Loading Animation"] --> DisplaySuccessAlert["Display Success Alert"] --> ResetStores["Reset Image Store and Label Data Store"] --> HomePage[Home] --> End
```

## Click on Edit button

```mermaid
flowchart TD
    Start([Edit Details Button Clicked]) --> CheckInspectionID{"labelData.inspection_id?"}
    CheckInspectionID -->|No| NavigateToBase["Navigate to /label-data-validation"] --> End([End])
    CheckInspectionID -->|Yes| NavigateToInspection["Navigate to /label-data-validation/<inspection_id>"] --> End
```
