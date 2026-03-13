import { create } from "zustand"

// ============================== Types ==============================
export type AccordionSection =
  | "association"
  | "basic"
  | "npk"
  | "ingredients"
  | "guaranteed"
  | "statements"
export type AccordionState = Record<AccordionSection, boolean>
interface FieldMetadata {
  needs_review: boolean
}
interface LabelDataStore {
  // ============================== Accordion State ==============================
  accordionState: Map<string, AccordionState>
  setAccordionExpanded: (
    labelId: string,
    section: AccordionSection,
    expanded: boolean,
  ) => void
  toggleAccordionSection: (labelId: string, section: AccordionSection) => void
  getAccordionState: (labelId: string) => AccordionState
  // ============================== Metadata State ==============================
  metadata: Map<string, Record<string, FieldMetadata>>
  setFieldMetadata: (
    labelId: string,
    fieldName: string,
    metadata: Partial<FieldMetadata>,
  ) => void
  getFieldMetadata: (
    labelId: string,
    fieldName: string,
  ) => FieldMetadata | undefined
  // ============================== Save State Tracking ==============================
  pendingSaves: Set<string>
  failedSaves: Set<string>
  addPendingSave: (labelId: string) => void
  removePendingSave: (labelId: string) => void
  addFailedSave: (labelId: string) => void
  removeFailedSave: (labelId: string) => void
  hasPendingOrFailedSaves: (labelId: string) => boolean
  // ============================== Extraction State ==============================
  extractingLabelIds: Set<string>
  extractingFields: Map<string, Set<string>>
  setExtracting: (labelId: string, isExtracting: boolean) => void
  isExtracting: (labelId: string) => boolean
  setFieldExtracting: (
    labelId: string,
    fieldName: string,
    isExtracting: boolean,
  ) => void
  isFieldExtracting: (labelId: string, fieldName: string) => boolean
}
const defaultAccordionState: AccordionState = {
  association: false,
  basic: true,
  npk: true,
  ingredients: true,
  guaranteed: true,
  statements: true,
}
const store = (set: any, get: any): LabelDataStore => ({
  // ============================== Accordion State ==============================
  accordionState: new Map(),
  setAccordionExpanded: (
    labelId: string,
    section: AccordionSection,
    expanded: boolean,
  ) => {
    set((state: LabelDataStore) => {
      const newMap = new Map(state.accordionState)
      const currentState = newMap.get(labelId) ?? { ...defaultAccordionState }
      newMap.set(labelId, { ...currentState, [section]: expanded })
      return { accordionState: newMap }
    })
  },
  toggleAccordionSection: (labelId: string, section: AccordionSection) => {
    const state = get()
    const currentState = state.accordionState.get(labelId) ?? {
      ...defaultAccordionState,
    }
    state.setAccordionExpanded(labelId, section, !currentState[section])
  },
  getAccordionState: (labelId: string) => {
    const state = get()
    return state.accordionState.get(labelId) ?? { ...defaultAccordionState }
  },
  // ============================== Metadata State ==============================
  metadata: new Map(),
  setFieldMetadata: (
    labelId: string,
    fieldName: string,
    metadata: Partial<FieldMetadata>,
  ) => {
    set((state: LabelDataStore) => {
      const newMap = new Map(state.metadata)
      const labelMetadata = newMap.get(labelId) ?? {}
      const fieldMetadata = labelMetadata[fieldName] ?? {
        needs_review: false,
      }
      newMap.set(labelId, {
        ...labelMetadata,
        [fieldName]: { ...fieldMetadata, ...metadata },
      })
      return { metadata: newMap }
    })
  },
  getFieldMetadata: (labelId: string, fieldName: string) => {
    const state = get()
    return state.metadata.get(labelId)?.[fieldName]
  },
  // ============================== Save State Tracking ==============================
  pendingSaves: new Set(),
  failedSaves: new Set(),
  addPendingSave: (labelId: string) => {
    set((state: LabelDataStore) => {
      const newSet = new Set(state.pendingSaves)
      newSet.add(labelId)
      return { pendingSaves: newSet }
    })
  },
  removePendingSave: (labelId: string) => {
    set((state: LabelDataStore) => {
      const newSet = new Set(state.pendingSaves)
      newSet.delete(labelId)
      return { pendingSaves: newSet }
    })
  },
  addFailedSave: (labelId: string) => {
    set((state: LabelDataStore) => {
      const newSet = new Set(state.failedSaves)
      newSet.add(labelId)
      return { failedSaves: newSet }
    })
  },
  removeFailedSave: (labelId: string) => {
    set((state: LabelDataStore) => {
      const newSet = new Set(state.failedSaves)
      newSet.delete(labelId)
      return { failedSaves: newSet }
    })
  },
  hasPendingOrFailedSaves: (labelId: string) => {
    const state = get()
    return state.pendingSaves.has(labelId) || state.failedSaves.has(labelId)
  },
  // ============================== Extraction State ==============================
  extractingLabelIds: new Set(),
  extractingFields: new Map(),
  setExtracting: (labelId: string, isExtracting: boolean) => {
    set((state: LabelDataStore) => {
      const newSet = new Set(state.extractingLabelIds)
      if (isExtracting) {
        newSet.add(labelId)
      } else {
        newSet.delete(labelId)
      }
      return { extractingLabelIds: newSet }
    })
  },
  isExtracting: (labelId: string) => {
    const state = get()
    return state.extractingLabelIds.has(labelId)
  },
  setFieldExtracting: (
    labelId: string,
    fieldName: string,
    isExtracting: boolean,
  ) => {
    set((state: LabelDataStore) => {
      const newMap = new Map(state.extractingFields)
      const fieldSet = newMap.get(labelId) ?? new Set<string>()
      const newFieldSet = new Set(fieldSet)
      if (isExtracting) {
        newFieldSet.add(fieldName)
      } else {
        newFieldSet.delete(fieldName)
      }
      newMap.set(labelId, newFieldSet)
      return { extractingFields: newMap }
    })
  },
  isFieldExtracting: (labelId: string, fieldName: string) => {
    const state = get()
    return state.extractingFields.get(labelId)?.has(fieldName) ?? false
  },
})
export const useLabelDataStore = create<LabelDataStore>()(store)
