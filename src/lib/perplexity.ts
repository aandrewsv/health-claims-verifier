const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason?: string;
  }>;
}

export interface PerplexityConfig {
  systemPrompt?: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  search_recency_filter?: string;
}

export async function queryPerplexity(
  prompt: string,
  config: PerplexityConfig = {}
): Promise<PerplexityResponse> {
  const {
    max_tokens = 4096,
    temperature = 0,
    top_p = 1,
    search_recency_filter,
  } = config;

  try {
    console.log('Making API request with prompt:', prompt);

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens,
        temperature,
        top_p,
        ...(search_recency_filter && { search_recency_filter }),
        stream: false,
      }),
    });

    const responseText = await response.text();
    console.log('Raw API response:', responseText);

    if (!response.ok) {
      throw new Error(
        `API request failed with status ${response.status}: ${responseText}`
      );
    }

    const data = JSON.parse(responseText) as PerplexityResponse;

    if (!data.choices?.[0]?.message?.content) {
      console.error('Unexpected API response structure:', data);
      throw new Error('Invalid API response format');
    }

    return data;
  } catch (error) {
    console.error('Perplexity API error:', error);
    throw error;
  }
}

export async function queryPerplexityJSONObject<T>(
  prompt: string,
  config?: PerplexityConfig
): Promise<T> {
  try {
    const response = await queryPerplexity(prompt, { ...config });

    // Check for truncation
    if (response.choices[0].finish_reason === 'length') {
      throw new Error('Response was truncated due to length limits');
    }

    const content = response.choices[0].message.content;

    // Now parse the content itself as our expected type T
    const cleanResponse = content
      // First, remove the code blocks
      .replace(/```json|```/g, '')
      .trim()

      // IMPORTANT: Handle URL forward slashes before any other cleaning
      .replace(/(https?:\/\/[^"\s]+)/g, (url) => {
        // Double-escape forward slashes in URLs
        return url.replace(/\//g, '\\/');
      })

      // Remove comments
      .replace(/\s*\/\/.*$/gm, '')

      // Then handle all Unicode characters
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Zero-width chars
      .replace(/[\u2013\u2014]/g, '-') // En/em dashes
      .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
      .replace(/[\u2018\u2019]/g, "'") // Smart single quotes
      .replace(/\u00A0/g, ' ') // Non-breaking space
      .replace(/\u202F/g, ' ') // Narrow no-break space
      .replace(/\u200E/g, ' ') // Left-to-right mark
      .replace(/\u200F/g, ' ') // Right-to-left mark
      .replace(/\u2028|\u2029/g, ' ') // Line separators
      .replace(/[\u20A0-\u20CF]/g, '') // Currency symbols range
      .replace(/[\u00A2-\u00A5]/g, '') // Cent, pound, currency, yen signs
      .replace(/[\u2200-\u22FF]/g, '') // Mathematical operators
      .replace(/[\u2100-\u214F]/g, '') // Letterlike symbols
      .replace(/[\u2190-\u21FF]/g, '') // Arrows
      .replace(/[\u2300-\u23FF]/g, '') // Miscellaneous technical
      .replace(/[\u2000-\u206F]/g, '') // General punctuation
      .replace(/[\u2700-\u27BF]/g, '') // Dingbats
      .replace(/[\u2600-\u26FF]/g, '') // Miscellaneous symbols
      .replace(/[\u2E00-\u2E7F]/g, '') // Supplemental punctuation
      .replace(/[\u3000-\u303F]/g, '') // CJK symbols and punctuation
      .replace(/[\u02B0-\u02FF]/g, '') // Spacing modifier letters
      .replace(/[\u0300-\u036F]/g, '') // Combining diacritical marks
      .replace(/[\u00A6-\u00A9]/g, '') // Broken bar, section, copyright
      .replace(/[\u00AB-\u00AC]/g, '') // Left/right-pointing double angle quotation marks
      .replace(/[\u00AE-\u00B1]/g, '') // Registered sign, macron, degree, plus-minus
      .replace(/[\u00B4-\u00B8]/g, '') // Acute accent, micro sign, pilcrow sign, middle dot
      .replace(/[\u00BB-\u00BE]/g, '') // Right-pointing double angle quotation mark
      .replace(/[\u2010-\u2015]/g, '-') // Various forms of dashes and hyphens
      .replace(/[\u2016-\u2027]/g, '') // Double vertical line through to commercial minus
      .replace(/[\u2030-\u205E]/g, '') // Per mille sign through to vertical four dots
      .replace(/[\u2039-\u203A]/g, '') // Single left/right-pointing angle quotation marks
      .replace(/[\u2045-\u2051]/g, '') // Bracket symbols
      .replace(/[\u2057-\u205F]/g, '') // Quad stacking symbols
      .replace(/[\u20D0-\u20FF]/g, '') // Combining diacritical marks for symbols
      .replace(/[\u2100-\u214F]/g, '') // Letterlike symbols
      .replace(/[\u2150-\u218F]/g, '') // Number forms
      .replace(/[\u2190-\u21FF]/g, '') // Arrows
      .replace(/[\u2200-\u22FF]/g, '') // Mathematical operators
      .replace(/[\u2300-\u23FF]/g, '') // Miscellaneous technical
      .replace(/[\u2400-\u243F]/g, '') // Control pictures
      .replace(/[\u2440-\u245F]/g, '') // Optical character recognition
      .replace(/[\u2460-\u24FF]/g, '') // Enclosed alphanumerics
      .replace(/[\u2000-\u200F]/g, ' ') // Various spaces and zero-width characters
      .replace(/[\u2028-\u202F]/g, ' ') // Line and paragraph separators
      .replace(/[\u205F-\u206F]/g, ' ') // Mathematical spaces and invisible operators
      .replace(/[\u2018\u2019\u201A\u201B]/g, "'") // Smart single quotes and low quotation mark
      .replace(/[\u201C\u201D\u201E\u201F]/g, '"') // Smart double quotes and low quotation mark
      .replace(/[\u2010-\u2015\u2212]/g, '-') // All forms of hyphens and minus signs
      .replace(/[\u2028\u2029]/g, '\n') // Line and paragraph separators
      .replace(/[\uFFF0-\uFFFF]/g, '') // Specials
      .replace(/[\uFE00-\uFE0F]/g, '') // Variation selectors
      .replace(/[\uFE20-\uFE2F]/g, '') // Combining half marks
      .replace(/[\uFE30-\uFE4F]/g, '') // CJK compatibility forms
      .replace(/[\uFE50-\uFE6F]/g, '') // Small form variants
      .replace(/[\uFE70-\uFEFF]/g, '') // Arabic presentation forms-B
      .replace(/[\u2212-\u221F]/g, '-') // Batch replace all math symbols

      // Handle problematic URL characters
      .replace(/[\u2215]/g, '/') // Division slash to forward slash
      .replace(/[‌​]/g, '') // Zero-width non-joiner and zero-width space
      .replace(/[﻿]/g, '') // Byte order mark

      // Final cleanup for any remaining problematic characters
      .replace(/[^\x20-\x7E]/g, '') // Remove any remaining non-ASCII characters
      .replace(/(\r\n|\n|\r)/gm, '') // Remove line breaks
      .replace(/(\s){2,}/g, ' '); // Remove multiple spaces
    const jsonStart = cleanResponse.indexOf('{');
    const jsonEnd = cleanResponse.lastIndexOf('}') + 1;
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No valid JSON objects found in the content');
    }

    const jsonString = cleanResponse.substring(jsonStart, jsonEnd);
    const result = JSON.parse(jsonString) as T;
    return result;
  } catch (error) {
    console.error('Failed to parse JSON response:', error);

    if (error instanceof Error) {
      throw new Error(`Invalid JSON response from AI: ${error.message}`);
    }
    throw new Error('Invalid JSON response from AI');
  }
}

export async function queryPerplexityJSONArray<T>(
  prompt: string,
  config?: PerplexityConfig
): Promise<T> {
  try {
    // 1. Make the API call
    const response = await queryPerplexity(prompt, { ...config });

    // 2. Check for truncation
    if (response.choices[0].finish_reason === 'length') {
      throw new Error('Response was truncated due to length limits');
    }

    // 3. Get the content string
    const content = response.choices[0].message.content;

    // 4. Clean up code fences, triple backticks, etc.
    const cleanResponse = content
      // First, remove the code blocks
      .replace(/```json|```/g, '')
      .trim()

      // IMPORTANT: Handle URL forward slashes before any other cleaning
      .replace(/(https?:\/\/[^"\s]+)/g, (url) => {
        // Double-escape forward slashes in URLs
        return url.replace(/\//g, '\\/');
      })

      // Remove comments
      .replace(/\s*\/\/.*$/gm, '')

      // Then handle all Unicode characters
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Zero-width chars
      .replace(/[\u2013\u2014]/g, '-') // En/em dashes
      .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
      .replace(/[\u2018\u2019]/g, "'") // Smart single quotes
      .replace(/\u00A0/g, ' ') // Non-breaking space
      .replace(/\u202F/g, ' ') // Narrow no-break space
      .replace(/\u200E/g, ' ') // Left-to-right mark
      .replace(/\u200F/g, ' ') // Right-to-left mark
      .replace(/\u2028|\u2029/g, ' ') // Line separators
      .replace(/[\u20A0-\u20CF]/g, '') // Currency symbols range
      .replace(/[\u00A2-\u00A5]/g, '') // Cent, pound, currency, yen signs
      .replace(/[\u2200-\u22FF]/g, '') // Mathematical operators
      .replace(/[\u2100-\u214F]/g, '') // Letterlike symbols
      .replace(/[\u2190-\u21FF]/g, '') // Arrows
      .replace(/[\u2300-\u23FF]/g, '') // Miscellaneous technical
      .replace(/[\u2000-\u206F]/g, '') // General punctuation
      .replace(/[\u2700-\u27BF]/g, '') // Dingbats
      .replace(/[\u2600-\u26FF]/g, '') // Miscellaneous symbols
      .replace(/[\u2E00-\u2E7F]/g, '') // Supplemental punctuation
      .replace(/[\u3000-\u303F]/g, '') // CJK symbols and punctuation
      .replace(/[\u02B0-\u02FF]/g, '') // Spacing modifier letters
      .replace(/[\u0300-\u036F]/g, '') // Combining diacritical marks
      .replace(/[\u00A6-\u00A9]/g, '') // Broken bar, section, copyright
      .replace(/[\u00AB-\u00AC]/g, '') // Left/right-pointing double angle quotation marks
      .replace(/[\u00AE-\u00B1]/g, '') // Registered sign, macron, degree, plus-minus
      .replace(/[\u00B4-\u00B8]/g, '') // Acute accent, micro sign, pilcrow sign, middle dot
      .replace(/[\u00BB-\u00BE]/g, '') // Right-pointing double angle quotation mark
      .replace(/[\u2010-\u2015]/g, '-') // Various forms of dashes and hyphens
      .replace(/[\u2016-\u2027]/g, '') // Double vertical line through to commercial minus
      .replace(/[\u2030-\u205E]/g, '') // Per mille sign through to vertical four dots
      .replace(/[\u2039-\u203A]/g, '') // Single left/right-pointing angle quotation marks
      .replace(/[\u2045-\u2051]/g, '') // Bracket symbols
      .replace(/[\u2057-\u205F]/g, '') // Quad stacking symbols
      .replace(/[\u20D0-\u20FF]/g, '') // Combining diacritical marks for symbols
      .replace(/[\u2100-\u214F]/g, '') // Letterlike symbols
      .replace(/[\u2150-\u218F]/g, '') // Number forms
      .replace(/[\u2190-\u21FF]/g, '') // Arrows
      .replace(/[\u2200-\u22FF]/g, '') // Mathematical operators
      .replace(/[\u2300-\u23FF]/g, '') // Miscellaneous technical
      .replace(/[\u2400-\u243F]/g, '') // Control pictures
      .replace(/[\u2440-\u245F]/g, '') // Optical character recognition
      .replace(/[\u2460-\u24FF]/g, '') // Enclosed alphanumerics
      .replace(/[\u2000-\u200F]/g, ' ') // Various spaces and zero-width characters
      .replace(/[\u2028-\u202F]/g, ' ') // Line and paragraph separators
      .replace(/[\u205F-\u206F]/g, ' ') // Mathematical spaces and invisible operators
      .replace(/[\u2018\u2019\u201A\u201B]/g, "'") // Smart single quotes and low quotation mark
      .replace(/[\u201C\u201D\u201E\u201F]/g, '"') // Smart double quotes and low quotation mark
      .replace(/[\u2010-\u2015\u2212]/g, '-') // All forms of hyphens and minus signs
      .replace(/[\u2028\u2029]/g, '\n') // Line and paragraph separators
      .replace(/[\uFFF0-\uFFFF]/g, '') // Specials
      .replace(/[\uFE00-\uFE0F]/g, '') // Variation selectors
      .replace(/[\uFE20-\uFE2F]/g, '') // Combining half marks
      .replace(/[\uFE30-\uFE4F]/g, '') // CJK compatibility forms
      .replace(/[\uFE50-\uFE6F]/g, '') // Small form variants
      .replace(/[\uFE70-\uFEFF]/g, '') // Arabic presentation forms-B
      .replace(/[\u2212-\u221F]/g, '-') // Batch replace all math symbols

      // Handle problematic URL characters
      .replace(/[\u2215]/g, '/') // Division slash to forward slash
      .replace(/[‌​]/g, '') // Zero-width non-joiner and zero-width space
      .replace(/[﻿]/g, '') // Byte order mark

      // Final cleanup for any remaining problematic characters
      .replace(/[^\x20-\x7E]/g, '') // Remove any remaining non-ASCII characters
      .replace(/(\r\n|\n|\r)/gm, '') // Remove line breaks
      .replace(/(\s){2,}/g, ' '); // Remove multiple spaces

    // 5. Extract the array portion with a regex that matches [ ... ] across multiple lines
    const match = cleanResponse.match(/\[[\s\S]*\]/);
    if (!match) {
      throw new Error('No valid JSON array found in the content');
    }

    // 6. Parse the substring as JSON
    const arrayString = match[0];
    const result = JSON.parse(arrayString) as T[];

    return result;
  } catch (error) {
    console.error('Failed to parse JSON array response:', error);
    if (error instanceof Error) {
      throw new Error(`Invalid JSON array response from AI: ${error.message}`);
    }
    throw new Error('Invalid JSON array response from AI');
  }
}
