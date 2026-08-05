export interface PropertyItem {
  propertyId: number;
  propertyName: string;
  builderId: number;
  builderName: string;
  location: string;
  areaSqft?: number | null;
  price?: number | null;
  purchaseType: string;
  flatNumber?: string | null;
  floorNumber?: string | null;
  unit?: string | null;
  propertyGroup?: string | null;
  inventory?: string | null;
  assignedTo?: number | null;
  assignedToName?: string | null;
  createdOn?: string;
  hasImage?: boolean;
}

export interface BuilderItem {
  builderId: number;
  builderName: string;
}

export interface ExecutiveItem {
  userId: number;
  fullName: string;
}

export interface PropertyDetails {
  propertyId: number;
  propertyName: string;
  builderName: string;
  location: string;
  areaSqft: number | null;
  price: number | null;
  purchaseType: string;
  flatNumber?: string | null;
  floorNumber?: string | null;
  unit?: string | null;
  propertyGroup?: string | null;
  inventory?: string | null;
  assignedTo: number | null;
  propertyImage?: number[] | null; // Byte array
}

export interface FlatItem {
  flatId: number;
  propertyId: number;
  blockName: string;
  floorName: string;
  flatName: string;
  bhk: string;
  propertyType: string;
  propertyGroup: string;
  areaSqft: number | null;
  location: string;
  bedroomCount: number | null;
  bathroomCount: number | null;
  parkingAvailable: boolean;
  flatStatus: string;
  price: number | null;
}

export interface PropertyImageItem {
  uploadId: number;
  fileName: string;
  contentType: string;
  fileType: string;
  uploadedOn: string;
  uploadedBy?: string | null;
}

export interface PropertyListResponse {
  success: boolean;
  properties: PropertyItem[];
  message?: string;
}

export interface BuildersResponse {
  success: boolean;
  builders: BuilderItem[];
}

export interface ExecutivesResponse {
  success: boolean;
  executives: ExecutiveItem[];
}

export interface GeneralApiResponse {
  success: boolean;
  message: string;
}
