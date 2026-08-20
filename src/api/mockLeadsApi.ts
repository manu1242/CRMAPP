import AsyncStorage from '@react-native-async-storage/async-storage';
import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Storage keys
const STAGES_KEY = '@mock_lead_stages';
const FOLLOWUPS_KEY = '@mock_lead_followups';
const LOGS_KEY = '@mock_lead_logs';

export interface MockFollowUp {
    followUpId: number;
    leadId: number;
    stage: string;
    status: string;
    propertyId?: number;
    rating?: string;
    followUpDate: string;
    followUpTime?: string;
    comments?: string;
    executiveId?: number;
    createdOn: string;
    updatedOn?: string;
    completedOn?: string;
    completedBy?: string | number;
    completionNotes?: string;
    interestStatus?: string;
}

export interface MockLog {
    historyId: number;
    activity: string;
    activityDate: string;
    executiveId?: number;
}

// Memory caches
let cachedStages: Record<string, string> = {};
let cachedFollowUps: Record<string, MockFollowUp[]> = {};
let cachedLogs: Record<string, MockLog[]> = {};

let isLoaded = false;

// Load persisted mock data from AsyncStorage
async function loadMockData() {
    if (isLoaded) return;
    try {
        const stagesStr = await AsyncStorage.getItem(STAGES_KEY);
        if (stagesStr) cachedStages = JSON.parse(stagesStr);

        const followUpsStr = await AsyncStorage.getItem(FOLLOWUPS_KEY);
        if (followUpsStr) cachedFollowUps = JSON.parse(followUpsStr);

        const logsStr = await AsyncStorage.getItem(LOGS_KEY);
        if (logsStr) cachedLogs = JSON.parse(logsStr);
    } catch (e) {
        console.error('Failed to load mock data:', e);
    }
    isLoaded = true;
}

// Save mock data helper
async function saveMockData(key: string, data: any) {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error(`Failed to save mock data for ${key}:`, e);
    }
}

// Form options response
export const formOptionsData = {
    stages: [
        { value: "New", label: "New" },
        { value: "Office Meeting", label: "Office Meeting" },
        { value: "Site Visit Requested", label: "Site Visit Requested" },
        { value: "Site Visit Done", label: "Site Visit Done" },
        { value: "Quotation", label: "Quotation" },
        { value: "Quotation Sent", label: "Quotation Sent" },
        { value: "Negotiation", label: "Negotiation" },
        { value: "Booked", label: "Booked" }
    ],
    statuses: [
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" },
        { value: "Hot", label: "Hot" },
        { value: "Warm", label: "Warm" },
        { value: "Cold", label: "Cold" }
    ],
    followUpStatuses: [
        { value: "Scheduled", label: "Scheduled" },
        { value: "Completed", label: "Completed" },
        { value: "Cancelled", label: "Cancelled" },
        { value: "Rescheduled", label: "Rescheduled" }
    ],
    ratings: [
        { value: "1", label: "1 Star" },
        { value: "2", label: "2 Stars" },
        { value: "3", label: "3 Stars" },
        { value: "4", label: "4 Stars" },
        { value: "5", label: "5 Stars" }
    ],
    sources: [
        { value: "Website", label: "Website" },
        { value: "Referral", label: "Referral" },
        { value: "Walk-in", label: "Walk-in" },
        { value: "Social Media", label: "Social Media" },
        { value: "Advertisement", label: "Advertisement" },
        { value: "Other", label: "Other" }
    ],
    interestStatuses: [
        { value: "Interested", label: "Interested" },
        { value: "Not Interested", label: "Not Interested" },
        { value: "Need More Info", label: "Need More Info" }
    ]
};

export async function handleMockRequest(config: InternalAxiosRequestConfig): Promise<AxiosResponse | null> {
    const url = config.url || '';
    const method = (config.method || 'get').toLowerCase();

    await loadMockData();

    // 1. GET /api/leads/form-options
    if (method === 'get' && url.includes('/api/leads/form-options')) {
        return {
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            data: {
                success: true,
                message: "Form options retrieved successfully",
                data: formOptionsData
            }
        } as AxiosResponse;
    }

    // 2. POST /api/leads/{id}/follow-ups
    const addMatch = url.match(/\/api\/leads\/([^/]+)\/follow-ups$/);
    if (method === 'post' && addMatch) {
        const leadId = addMatch[1];
        const body = config.data ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) : {};

        const { stage, followUpDate, followUpTime, status, comments, rating, interestStatus, propertyId, executiveId } = body;

        // Validation matching requirements: Stage and FollowUpDate are required
        if (!stage || !followUpDate) {
            return Promise.reject({
                response: {
                    status: 400,
                    statusText: 'Bad Request',
                    headers: {},
                    config,
                    data: {
                        success: false,
                        message: "Stage and FollowUpDate are required."
                    }
                }
            });
        }

        const currentStage = cachedStages[leadId] || 'New';
        if (stage !== currentStage) {
            // Log transition history
            const logEntry: MockLog = {
                historyId: Date.now() + 1,
                activity: `Stage changed from ${currentStage} to ${stage} via Follow-up`,
                activityDate: new Date().toISOString(),
                executiveId: executiveId || 7
            };
            const logs = cachedLogs[leadId] || [];
            logs.push(logEntry);
            cachedLogs[leadId] = logs;
            await saveMockData(LOGS_KEY, cachedLogs);

            // Sync lead stage
            cachedStages[leadId] = stage;
            await saveMockData(STAGES_KEY, cachedStages);
        }

        const newFollowUp: MockFollowUp = {
            followUpId: Date.now(),
            leadId: Number(leadId),
            stage,
            status: status || 'Scheduled',
            propertyId: propertyId ? Number(propertyId) : undefined,
            rating,
            followUpDate,
            followUpTime,
            comments,
            executiveId: executiveId || 7,
            createdOn: new Date().toISOString()
        };

        const followUps = cachedFollowUps[leadId] || [];
        followUps.push(newFollowUp);
        cachedFollowUps[leadId] = followUps;
        await saveMockData(FOLLOWUPS_KEY, cachedFollowUps);

        return {
            status: 201,
            statusText: 'Created',
            headers: {},
            config,
            data: {
                success: true,
                message: "Follow-up added successfully",
                data: newFollowUp
            }
        } as AxiosResponse;
    }

    // 3. PUT /api/leads/{id}/follow-ups/{followUpId}
    const editMatch = url.match(/\/api\/leads\/([^/]+)\/follow-ups\/([^/]+)$/);
    if (method === 'put' && editMatch) {
        const leadId = editMatch[1];
        const followUpId = Number(editMatch[2]);
        const body = config.data ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) : {};

        const followUps = cachedFollowUps[leadId] || [];
        const index = followUps.findIndex(f => f.followUpId === followUpId);

        if (index === -1) {
            return Promise.reject({
                response: {
                    status: 404,
                    statusText: 'Not Found',
                    headers: {},
                    config,
                    data: {
                        success: false,
                        message: "Follow-up record not found for this lead."
                    }
                }
            });
        }

        // Apply partial updates
        const existing = followUps[index];
        const updated = { ...existing, ...body, updatedOn: new Date().toISOString() };

        // Auto-sets CompletedOn / CompletedBy when status is "Completed"
        if (body.status === 'Completed' && existing.status !== 'Completed') {
            updated.completedOn = new Date().toISOString();
            updated.completedBy = body.executiveId || updated.executiveId || 7;
        }

        // Sync lead's Stage and logs history if the stage changed
        const currentStage = cachedStages[leadId] || existing.stage || 'New';
        if (body.stage && body.stage !== currentStage) {
            const logEntry: MockLog = {
                historyId: Date.now() + 1,
                activity: `Stage changed from ${currentStage} to ${body.stage} via Follow-up Update`,
                activityDate: new Date().toISOString(),
                executiveId: body.executiveId || updated.executiveId || 7
            };
            const logs = cachedLogs[leadId] || [];
            logs.push(logEntry);
            cachedLogs[leadId] = logs;
            await saveMockData(LOGS_KEY, cachedLogs);

            cachedStages[leadId] = body.stage;
            await saveMockData(STAGES_KEY, cachedStages);

            updated.stage = body.stage;
        }

        followUps[index] = updated;
        cachedFollowUps[leadId] = followUps;
        await saveMockData(FOLLOWUPS_KEY, cachedFollowUps);

        return {
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            data: {
                success: true,
                message: "Follow-up updated successfully",
                data: {
                    followUpId: updated.followUpId,
                    leadId: updated.leadId,
                    stage: updated.stage,
                    status: updated.status,
                    completionNotes: updated.completionNotes,
                    completedOn: updated.completedOn,
                    updatedOn: updated.updatedOn
                }
            }
        } as AxiosResponse;
    }

    return null;
}

export async function handleMockResponse(response: AxiosResponse): Promise<AxiosResponse> {
    const url = response.config?.url || '';
    const method = (response.config?.method || 'get').toLowerCase();

    if (method === 'get' && response.data && response.data.success && response.data.data) {
        // Check if details or single lead
        const detailsMatch = url.match(/\/api\/v1\/LeadsApi\/([^/]+)\/details$/) ||
            url.match(/\/api\/v1\/LeadsApi\/([^/]+)\/full-details$/) ||
            url.match(/\/api\/v1\/LeadsApi\/([^/]+)$/);

        if (detailsMatch) {
            const leadId = detailsMatch[1];
            await loadMockData();

            const d = response.data.data;

            // Ensure contactInformation exists
            if (d.contactInformation) {
                // Cache original stage if not cached yet
                if (!cachedStages[leadId] && d.contactInformation.stage) {
                    cachedStages[leadId] = d.contactInformation.stage;
                    await saveMockData(STAGES_KEY, cachedStages);
                }

                // Apply cached stage to the response
                if (cachedStages[leadId]) {
                    d.contactInformation.stage = cachedStages[leadId];
                }

                // Merge follow-ups
                const mockFollowUpsList = cachedFollowUps[leadId] || [];
                if (mockFollowUpsList.length > 0) {
                    const existingFollowUps = d.followUps || [];
                    const mergedFollowUps = [...existingFollowUps];

                    mockFollowUpsList.forEach(mf => {
                        const idx = mergedFollowUps.findIndex(f => f.followUpId === mf.followUpId);
                        if (idx === -1) {
                            mergedFollowUps.push(mf);
                        } else {
                            mergedFollowUps[idx] = { ...mergedFollowUps[idx], ...mf };
                        }
                    });

                    d.followUps = mergedFollowUps;
                }

                // Merge activity logs
                const mockLogsList = cachedLogs[leadId] || [];
                if (mockLogsList.length > 0) {
                    const existingLogs = d.activities || [];
                    const mergedLogs = [...existingLogs];

                    mockLogsList.forEach(ml => {
                        if (!mergedLogs.some(l => l.historyId === ml.historyId)) {
                            mergedLogs.unshift({
                                historyId: ml.historyId,
                                activity: ml.activity,
                                activityDate: ml.activityDate,
                                executiveId: ml.executiveId
                            });
                        }
                    });

                    d.activities = mergedLogs;

                    // Merge into transitions as well if it's stage changes
                    const existingTransitions = d.transitions || [];
                    const mergedTransitions = [...existingTransitions];
                    mockLogsList.forEach(ml => {
                        if (ml.activity.includes('Stage changed') && !mergedTransitions.some(t => t.historyId === ml.historyId)) {
                            mergedTransitions.unshift({
                                historyId: ml.historyId,
                                activity: ml.activity,
                                activityDate: ml.activityDate,
                                executiveId: ml.executiveId
                            });
                        }
                    });
                    d.transitions = mergedTransitions;
                }
            } else if (typeof d.leadId !== 'undefined' || typeof d.stage !== 'undefined') {
                // Single lead object (e.g. GET /api/v1/LeadsApi/101)
                if (!cachedStages[leadId] && d.stage) {
                    cachedStages[leadId] = d.stage;
                    await saveMockData(STAGES_KEY, cachedStages);
                }
                if (cachedStages[leadId]) {
                    d.stage = cachedStages[leadId];
                }
            }
        }
    }

    return response;
}
