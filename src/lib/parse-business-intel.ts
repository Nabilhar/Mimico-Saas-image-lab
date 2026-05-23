/**
 * Shared parsing utilities for business intel data
 * Safe to import in both client and server components
 */

/**
 * Extract offering names from products_services
 * Handles both old format (array of strings) and new format (object with practices)
 */
export function extractOfferingNames(data: any): string[] {
    if (!data) return [];
    
    // New nested object format
    if (typeof data === 'object' && !Array.isArray(data)) {
      return Object.keys(data);
    }
    
    // Legacy array format
    if (Array.isArray(data)) {
      return data;
    }
    
    return [];
  }
  
  /**
   * Extract signature practices grouped by offering
   * Returns empty object if data is in old array format or missing
   */
  export function extractPracticesByOffering(data: any): Record<string, string[]> {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return {};
    }
    
    const result: Record<string, string[]> = {};
    
    for (const [offering, practices] of Object.entries(data)) {
      if (Array.isArray(practices)) {
        // Filter to only keep strings (remove any nulls/undefined)
        result[offering] = practices.filter(p => typeof p === 'string' && p.length > 0);
      } else if (typeof practices === 'string' && practices.length > 0) {
        // Handle case where a single practice is a string instead of array
        result[offering] = [practices];
      }
    }
    
    return result;
  }
  
  /**
   * Parse interior layout from vision output
   */
  export function parseInteriorLayout(data: any): any {
    if (!data) return undefined;
    
    if (typeof data === 'object' && !Array.isArray(data)) {
      return {
        counter_position: data.counter_position,
        seating_style_density: data.seating_style_density,
        open_plan_or_divided_spaces: data.open_plan_or_divided_spaces,
        lighting_mood: data.lighting_mood,
        distinctive_design_feature: data.distinctive_design_feature,
      };
    }
    
    if (typeof data === 'string') {
      return {
        distinctive_design_feature: data,
      };
    }
    
    return undefined;
  }
  
  /**
   * Parse storefront architecture from vision output
   */
  export function parseExteriorLayout(data: any): any {
    if (!data) return undefined;
  
    if (typeof data === 'string') {
      return {
        building: { facade_style: data },
        features: {},
      };
    }
  
    if (typeof data === 'object' && !Array.isArray(data)) {
      const building = typeof data.building === 'string'
        ? { facade_style: data.building }
        : (data.building || {});
  
      const features = typeof data.features === 'string'
        ? { patio: data.features }
        : (data.features || {});
  
      return {
        building: {
          material:     building.material,
          facade_style: building.facade_style,
          stories:      building.stories,
          window_type:  building.window_type,
          door:         building.door,
        },
        features: {
          patio:            features.patio,
          planters:         features.planters,
          street_furniture: features.street_furniture,
          corner_unit:      features.corner_unit,
        },
      };
    }
  
    return undefined;
  }

  /**
 * parseZones — normalizes the new zones structure from vision output.
 * Each zone has layout + colors sub-objects.
 * Missing zones return null so downstream code can handle gracefully.
 */
export function parseZones(data: any): any {
  if (!data || typeof data !== 'object') return null;

  const parseZone = (z: any) => {
    if (!z || typeof z !== 'object') return null;
    return {
      layout: z.layout && typeof z.layout === 'object' ? {
        spatial_arrangement: z.layout.spatial_arrangement || null,
        focal_feature:       z.layout.focal_feature       || null,
        materials_finishes:  z.layout.materials_finishes  || null,
        lighting_mood:       z.layout.lighting_mood       || null,
        activity_zone:       z.layout.activity_zone       || null,
      } : null,
      colors: z.colors && typeof z.colors === 'object' ? {
        dominant:          z.colors.dominant          || null,
        supporting:        z.colors.supporting        || null,
        accent:            z.colors.accent            || null,
        materials_palette: z.colors.materials_palette || null,
      } : null,
    };
  };

  return {
    entrance:       parseZone(data.entrance),
    customer_space: parseZone(data.customer_space),
    work_space:     parseZone(data.work_space),
  };
}