export interface PropertyItem {
  propertyId: number;
  propertyName: string;
  builderId: number;
  builderName: string;
  developer?: string;
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
  imageUrl?: string | null;
  image?: string | null;
  propertyImage?: string | null;
  directImageUrl?: string | null;
  imageEndpoint?: string | null;
  thumbnailUrl?: string | null;
  totalFlats?: number;
  availableFlats?: number;
  isActive?: boolean;
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
  builderId?: number;
  builderName: string;
  builderPhone?: string;
  builderEmail?: string;
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
  assignedToName?: string | null;
  hasImage?: boolean;
  imageUrl?: string | null;
  image?: string | null;
  propertyImage?: string | number[] | null;
  directImageUrl?: string | null;
  imageEndpoint?: string | null;
  thumbnailUrl?: string | null;
  createdOn?: string;
  flats?: FlatItem[];
  images?: PropertyImageItem[];
  documents?: any[];
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
  imageUrl?: string | null;
  image?: string | null;
  url?: string | null;
}

export interface PropertyListResponse {
  success: boolean;
  properties: PropertyItem[];
  message?: string;
}

export interface BuildersResponse {
  success: boolean;
  builders: BuilderItem[];
  message?: string;
}

export interface ExecutivesResponse {
  success: boolean;
  executives: ExecutiveItem[];
  message?: string;
}

export interface GeneralApiResponse {
  success: boolean;
  message: string;
}
