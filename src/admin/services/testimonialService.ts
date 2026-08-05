import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';

export interface TestimonialItem {
  testimonialId: number;
  name: string;
  tag: string; // Maps to Designation in UI
  content: string;
  rating: number;
  imageBase64?: string;
  isActive: boolean;
  createdOn?: string;
}

export interface SaveTestimonialPayload {
  testimonialId: number; // 0 for create, else update
  name: string;
  tag: string;
  content: string;
  rating: number;
  imageBase64?: string;
  isActive: boolean;
}

export interface GetTestimonialsResponse {
  success: boolean;
  message?: string;
  data: TestimonialItem[];
}

export interface GetTestimonialDetailsResponse {
  success: boolean;
  message?: string;
  data: TestimonialItem;
}

export interface SaveTestimonialResponse {
  success: boolean;
  message?: string;
  data?: TestimonialItem;
}

export interface DeleteTestimonialResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export const testimonialService = {
  /**
   * 1. Get Testimonials List
   * @param isActive Optional filter for active testimonials
   */
  getTestimonials: async (isActive?: boolean): Promise<GetTestimonialsResponse> => {
    const url = isActive !== undefined 
      ? `${API_ENDPOINTS.TESTIMONIALS.LIST}?isActive=${isActive}`
      : API_ENDPOINTS.TESTIMONIALS.LIST;
    return await apiClient.get<GetTestimonialsResponse>(url);
  },

  /**
   * 2. Get Testimonial Details by ID
   */
  getTestimonialDetails: async (id: number | string): Promise<GetTestimonialDetailsResponse> => {
    return await apiClient.get<GetTestimonialDetailsResponse>(
      API_ENDPOINTS.TESTIMONIALS.DETAILS(id)
    );
  },

  /**
   * 3. Save / Update Testimonial
   */
  saveTestimonial: async (payload: SaveTestimonialPayload): Promise<SaveTestimonialResponse> => {
    return await apiClient.post<SaveTestimonialResponse>(
      API_ENDPOINTS.TESTIMONIALS.SAVE,
      payload
    );
  },

  /**
   * 4. Delete Testimonial
   */
  deleteTestimonial: async (id: number | string): Promise<DeleteTestimonialResponse> => {
    return await apiClient.delete<DeleteTestimonialResponse>(
      API_ENDPOINTS.TESTIMONIALS.DELETE(id)
    );
  },
};
