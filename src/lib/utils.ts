import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const sanitizeForUrl = (text: string) => {
    return text
      .replace(/<research>[\s\S]*?<\/research>/gi, "") 
      .replace(/^(here's|here is|this is|a 1-sentence).*?:\s*/i, '')
      .replace(/2481\s+Lake\s+Shore\s+Blvd\s+W(\s+in\s+Etobicoke)?/gi, 'modern building')
      .replace(/["'?#]/g, '')    
      .replace(/1:1/g, 'square')
      .replace(/[^\x00-\x7F]/g, "") 
      .replace(/\s+/g, ' ')
      .trim();
  };