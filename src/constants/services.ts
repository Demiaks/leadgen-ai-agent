
import { AIService } from '../../types';

export const AI_AGENCY_SERVICES: AIService[] = [
    {
        id: 'setter-ia',
        name: 'Setter IA (Texto Multicanal)',
        description: 'Responde WhatsApp, IG, Email y Web en <2 min, cualifica, agenda y filtra leads automáticamente.',
        setupCost: '1.000 – 2.500 €',
        monthlyCost: '350 – 3.000 €',
        roi: 'Incrementa primeras citas y reduce leads perdidos',
        recommendedProfile: 'DELEGADOR',
        scalingTip: 'Delegar parte técnica a freelance o equipo interno para ganar tiempo y escalar rápido'
    },
    {
        id: 'growth-ia',
        name: 'Paquete Growth (Setter + Voz IA)',
        description: 'Combina setter IA con agente de voz natural para confirmar citas y reducir no-shows.',
        setupCost: '1.500 – 3.500 €',
        monthlyCost: '650 – 4.000 €',
        roi: 'Reduce 30–40% de no-shows, duplica cierres con el mismo tráfico',
        recommendedProfile: 'DELEGADOR',
        scalingTip: 'Escalable a volumen de clientes, ideal para duplicar cierres sin aumentar leads'
    },
    {
        id: 'content-ia',
        name: 'Paquete Contenido (Clones + Reels)',
        description: 'Generación de 20–25 reels al mes con clones hiperrealistas, para posicionamiento y autoridad.',
        setupCost: '6.000 € (6 meses)',
        monthlyCost: '1.000 €/mes aprox.',
        roi: 'Incrementa autoridad y visibilidad, más oportunidades de negocio indirectas',
        recommendedProfile: 'VISIONARIO',
        scalingTip: 'Mantener consistencia de contenido para generar leads orgánicos'
    },
    {
        id: 'leads-ia',
        name: 'Paquete Captación de Leads (Embudo + Ads + Setter IA)',
        description: 'Embudo completo + campañas de Ads + setter IA que filtra leads.',
        setupCost: '2.900 €',
        monthlyCost: '1.000 – 5.000 €',
        roi: 'Más prospectos calificados y sistema de conversión desde el primer día',
        recommendedProfile: 'VISIONARIO',
        scalingTip: 'Ajustar ads según ticket y volumen, usar % sobre facturación para clientes grandes'
    },
    {
        id: 'launch-ia',
        name: 'Lanzamientos de Infoproductos con IA',
        description: 'Implementación de IA en lanzamientos (setter IA + agente de voz para webinars).',
        setupCost: '3.000 € mínimo si no validado',
        monthlyCost: '% sobre facturación generada (10% recomendado)',
        roi: '4–20x inversión en Ads, aumento de show-up y conversión',
        recommendedProfile: 'VISIONARIO',
        scalingTip: 'Usar embudos + seguimiento IA para maximizar asistencia y cierre'
    }
];
