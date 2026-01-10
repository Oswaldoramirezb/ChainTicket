// backend/services/serviceRecommendationAI.js
// AI Service Recommendations using AWS Bedrock

import {
  BedrockRuntimeClient,
  InvokeModelCommand
} from "@aws-sdk/client-bedrock-runtime";

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const DEFAULT_MODEL = process.env.BEDROCK_MODEL_ID || "amazon.nova-micro-v1:0";

// System prompt específico para recomendaciones de servicios
const SYSTEM_PROMPT = `You are an expert business consultant for ChainTicket, specialized in helping business owners create and optimize their service offerings.

Your role is to:
1. Suggest relevant services based on business type/category
2. Provide creative service ideas that match the industry
3. Recommend pricing strategies
4. Suggest service names, descriptions, and time estimates
5. Adapt recommendations to the specific business context

RULES:
- Always respond in JSON format
- Be creative but practical
- Consider industry standards
- Suggest 3-5 services per request
- Include realistic pricing and time estimates
- Match services to the business category`;

// Mapeo de categorías a imágenes
const CATEGORY_IMAGES = {
  restaurant_menu: {
    default: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80',
    lunch: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    dinner: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
    dessert: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&q=80',
    drinks: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80'
  },
  bar_lounge: {
    default: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80',
    cocktails: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=800&q=80',
    wine: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80',
    beer: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&q=80'
  },
  spa_beauty: {
    default: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
    massage: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80',
    facial: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80',
    nails: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80',
    hair: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80'
  },
  event_venue: {
    default: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    wedding: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80',
    concert: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
    conference: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80',
    party: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80'
  },
  fitness_gym: {
    default: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
    yoga: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
    crossfit: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
    personal: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80'
  }
};

// Obtener imagen apropiada según categoría y tipo de servicio
function getImageForService(businessCategory, serviceName) {
  const category = businessCategory?.toLowerCase() || 'event_venue';
  const name = serviceName?.toLowerCase() || '';
  
  // Mapear categorías comunes
  const categoryMap = {
    'restaurant': 'restaurant_menu',
    'restaurant_menu': 'restaurant_menu',
    'bar': 'bar_lounge',
    'lounge': 'bar_lounge',
    'spa': 'spa_beauty',
    'beauty': 'spa_beauty',
    'salon': 'spa_beauty',
    'event': 'event_venue',
    'venue': 'event_venue',
    'gym': 'fitness_gym',
    'fitness': 'fitness_gym'
  };
  
  const mappedCategory = categoryMap[category] || category;
  const categoryImages = CATEGORY_IMAGES[mappedCategory] || CATEGORY_IMAGES.event_venue;
  
  // Buscar imagen específica basada en el nombre del servicio
  for (const [key, imageUrl] of Object.entries(categoryImages)) {
    if (name.includes(key)) {
      return imageUrl;
    }
  }
  
  // Retornar imagen por defecto de la categoría
  return categoryImages.default;
}

// Generar recomendaciones de servicios
export async function generateServiceRecommendations(businessContext) {
  try {
    const { businessType, businessCategory, businessName, currentServices = [] } = businessContext;
    
    const userMessage = `Business Context:
- Name: ${businessName || 'Not specified'}
- Type: ${businessType || businessCategory || 'general'}
- Category: ${businessCategory || businessType || 'general'}
- Current services: ${currentServices.length > 0 ? currentServices.map(s => s.title).join(', ') : 'None yet'}

Task: Suggest 3-5 NEW services that would be perfect for this business. Consider:
1. Industry best practices
2. Popular offerings in this category
3. Services that complement existing ones
4. Realistic pricing for the market

Respond ONLY with a valid JSON array in this exact format:
[
  {
    "title": "Service name",
    "description": "Brief description of the service",
    "avgTime": 45,
    "totalStock": 20,
    "price": 500,
    "category": "specific category like 'massage', 'cocktails', 'dinner', etc"
  }
]

Important:
- avgTime in minutes (15-180)
- totalStock: number of available slots/items (10-100)
- price: in local currency, realistic for the service
- category: one word describing the specific type (used for image selection)
- Keep it practical and market-appropriate`;

    // Invocar Bedrock
    const response = await invokeNovaModel(userMessage);
    
    // Parse JSON response
    let recommendations = [];
    try {
      // Limpiar la respuesta para extraer solo el JSON
      let cleanResponse = response.trim();
      
      // Si viene envuelto en markdown code blocks, extraerlo
      if (cleanResponse.includes('```json')) {
        cleanResponse = cleanResponse.split('```json')[1].split('```')[0].trim();
      } else if (cleanResponse.includes('```')) {
        cleanResponse = cleanResponse.split('```')[1].split('```')[0].trim();
      }
      
      // Si empieza con texto antes del JSON, buscar el array
      const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }
      
      recommendations = JSON.parse(cleanResponse);
      
      // Agregar imágenes apropiadas a cada recomendación
      recommendations = recommendations.map(rec => ({
        ...rec,
        image: getImageForService(businessCategory || businessType, rec.category || rec.title),
        schedule: {
          openTime: '09:00',
          closeTime: '18:00',
          days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        }
      }));
      
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.log('Raw response:', response);
      
      // Fallback con recomendaciones básicas
      recommendations = getDefaultRecommendations(businessCategory || businessType);
    }
    
    return {
      success: true,
      recommendations,
      rawResponse: response
    };
    
  } catch (error) {
    console.error('Error generating service recommendations:', error);
    
    // Fallback
    return {
      success: true,
      recommendations: getDefaultRecommendations(businessContext.businessCategory || businessContext.businessType),
      fallback: true
    };
  }
}

// Recomendaciones por defecto si falla la IA
function getDefaultRecommendations(businessType) {
  const type = (businessType || 'restaurant').toLowerCase();
  
  const defaults = {
    restaurant: [
      {
        title: 'Breakfast Special',
        description: 'Complete breakfast with coffee and juice',
        avgTime: 30,
        totalStock: 40,
        price: 150,
        category: 'breakfast',
        image: CATEGORY_IMAGES.restaurant_menu.breakfast
      },
      {
        title: 'Lunch Menu',
        description: 'Full course lunch with drink',
        avgTime: 45,
        totalStock: 50,
        price: 250,
        category: 'lunch',
        image: CATEGORY_IMAGES.restaurant_menu.lunch
      },
      {
        title: 'Dinner Experience',
        description: 'Premium dinner with wine pairing',
        avgTime: 90,
        totalStock: 30,
        price: 500,
        category: 'dinner',
        image: CATEGORY_IMAGES.restaurant_menu.dinner
      }
    ],
    bar: [
      {
        title: 'Signature Cocktails',
        description: 'Exclusive house cocktail creation',
        avgTime: 15,
        totalStock: 100,
        price: 180,
        category: 'cocktails',
        image: CATEGORY_IMAGES.bar_lounge.cocktails
      },
      {
        title: 'Wine Tasting',
        description: 'Curated wine selection tasting',
        avgTime: 60,
        totalStock: 20,
        price: 350,
        category: 'wine',
        image: CATEGORY_IMAGES.bar_lounge.wine
      }
    ],
    spa: [
      {
        title: 'Relaxation Massage',
        description: '60-minute full body massage',
        avgTime: 60,
        totalStock: 12,
        price: 800,
        category: 'massage',
        image: CATEGORY_IMAGES.spa_beauty.massage
      },
      {
        title: 'Facial Treatment',
        description: 'Deep cleansing facial with moisturizing',
        avgTime: 45,
        totalStock: 15,
        price: 600,
        category: 'facial',
        image: CATEGORY_IMAGES.spa_beauty.facial
      }
    ]
  };
  
  return defaults[type] || defaults.restaurant;
}

// Invocar modelo Nova
async function invokeNovaModel(userMessage) {
  const payload = {
    schemaVersion: "messages-v1",
    messages: [
      {
        role: "user",
        content: [{ text: userMessage }]
      }
    ],
    system: [{ text: SYSTEM_PROMPT }],
    inferenceConfig: {
      maxTokens: 2048,
      temperature: 0.7,
      topP: 0.9
    }
  };
  
  const command = new InvokeModelCommand({
    modelId: DEFAULT_MODEL,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload),
  });
  
  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  
  return responseBody.output?.message?.content?.[0]?.text || "No response from model";
}

export default {
  generateServiceRecommendations,
  getImageForService
};

