export interface Agent{
    agentId: number,
    fullName: string,
    email: string,
    phone: string,
    address: string,
    agentType: string,
    salary: number,
    commissionRules: string,
    status: string,
    createdOn: string,
    approvedBy: number,
    approvedOn: string,
    channelPartnerId: number,
    agentDocuments: {
        documentId: number,
        fileName: string,
        documentName: string,
        documentType: string,
        fileSize: number,
        contentType: string,
        uploadedOn: string,
        verificationStatus: string,
        rejectionReason: string
    }[]
}