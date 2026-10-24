/**
 * Maps demo-domain rows into the neutral MatterSummarySource DTO.
 * Keep demo imports here — not in `buildMatterSummaryPayload`.
 */
import type {
  DemoCondoDiligence,
  DemoDocument,
  DemoDocumentRequest,
  DemoMatter,
} from '@/lib/demo/types'
import { isCondoDiligenceEligible } from '@/lib/demo/condoDiligence'
import { isFincenEligibleMatter } from '@/lib/demo/fincenEligibility'
import { getMatterPartyDisplayRows } from '@/lib/demo/matterPartyDisplay'
import { deriveMatterStatus } from '@/lib/demo-utils'
import type { MatterSummarySource } from '@/lib/ai/matter-summary-source'

export type DemoMatterSummaryAdapterInput = {
  matter: DemoMatter
  documents: DemoDocument[]
  documentRequests: DemoDocumentRequest[]
  condoDiligence?: DemoCondoDiligence | null
}

export function mapDemoMatterToSummarySource(
  input: DemoMatterSummaryAdapterInput,
): MatterSummarySource {
  const { matter, documents, documentRequests, condoDiligence = null } = input
  const condoEligible = isCondoDiligenceEligible(matter)
  const fincenEligible = isFincenEligibleMatter(matter)
  const fincen = matter.fincen

  let condoBlock: MatterSummarySource['compliance']['condoDiligence'] = {
    eligible: condoEligible,
    rowPresent: condoDiligence != null,
  }

  if (condoDiligence) {
    const rd = condoDiligence.requiredDocuments
    condoBlock = {
      ...condoBlock,
      applicable: condoDiligence.applicable,
      status: condoDiligence.status,
      requiredDocumentsTotal: rd.length,
      requiredDocumentsOutstanding: rd.filter((x) => x.status === 'outstanding').length,
      requiredDocumentsRequested: rd.filter((x) => x.status === 'requested').length,
      requiredDocumentsReceived: rd.filter((x) => x.status === 'received').length,
      findingsCount: condoDiligence.findings.length,
    }
  }

  return {
    identity: {
      matterId: matter.id,
      fileId: matter.file_id,
      matterType: matter.matter_type,
      hasPortalToken: Boolean(matter.portal_token?.trim()),
    },
    property: {
      address: matter.property.address,
      county: matter.property.county,
      propertyType: matter.property.property_type,
    },
    transaction: {
      transactionType: matter.transactionType,
      purchasePrice: matter.purchasePrice,
      financingType: matter.financingType,
      hoaFlag: matter.hoaFlag,
      keyDates: {
        effectiveDate: matter.key_dates.effective_date,
        inspectionDeadline: matter.key_dates.inspection_deadline,
        loanApprovalDeadline: matter.key_dates.loan_approval_deadline,
        closingDate: matter.key_dates.closing_date,
      },
    },
    matterStatusStored: matter.status,
    matterStatusDerivedFromTasks: deriveMatterStatus(matter.tasks, matter.key_dates.closing_date),
    parties: {
      buyer: { name: matter.buyer.name, partyType: matter.buyer.type },
      seller: { name: matter.seller.name, partyType: matter.seller.type },
      displayRows: getMatterPartyDisplayRows(matter),
    },
    tasks: (matter.tasks || []).map((t) => ({
      title: t.title,
      status: t.status,
      deletedAt: t.deletedAt,
    })),
    documents: documents.map((d) => ({
      matterId: d.matter_id,
      status: d.status,
      deletedAt: d.deletedAt,
    })),
    documentRequests: documentRequests.map((r) => ({
      matterId: r.matter_id,
      status: r.status,
    })),
    timeline: (matter.timeline || []).map((e) => ({
      at: e.at,
      note: e.note,
      deletedAt: e.deletedAt,
    })),
    compliance: {
      fincen: {
        eligible: fincenEligible,
        reportStatus: fincen?.reportStatus,
        completedFields: fincen?.completedFields,
        beneficialOwnerCount: fincen?.beneficialOwners?.length,
        certRequestPendingClient: fincen?.certRequest?.status === 'pending_client',
      },
      condoDiligence: condoBlock,
    },
  }
}
