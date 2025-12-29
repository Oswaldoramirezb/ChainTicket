# 📊 ChainTicket - Arquitectura de Base de Datos DynamoDB

## ¿Por qué 3 Tablas?

En DynamoDB, el patrón recomendado es **separar por patrones de acceso** en lugar de normalizar como en SQL. Cada tabla está optimizada para un tipo específico de consulta.

---

## Tabla 1: `business-metrics`
### 🎯 Propósito: Contexto para la IA

**¿Qué guarda?**
- Configuración y métricas actuales de cada negocio
- Historial agregado por semana (no cada transacción individual)
- Datos que la IA necesita para dar recomendaciones

**¿Por qué separada?**
- Se lee MUCHO (cada vez que el admin pregunta algo a la IA)
- Se escribe POCO (solo cuando se actualizan métricas)
- Necesita respuestas ultra-rápidas

**Estructura:**

| PK (Partition Key) | SK (Sort Key) | Contenido |
|--------------------|---------------|-----------|
| `BUSINESS#bar-123` | `METRICS` | Métricas actuales del negocio |
| `BUSINESS#bar-123` | `WEEK#2025-W52` | Datos agregados semana 52 |
| `BUSINESS#bar-123` | `WEEK#2025-W51` | Datos agregados semana 51 |

**Ejemplo de documento METRICS:**
```json
{
  "pk": "BUSINESS#bar-la-estrella",
  "sk": "METRICS",
  "businessName": "Bar La Estrella",
  "businessType": "bar",
  "maxCapacity": 200,
  "avgTicketsPerFriday": 145,
  "avgTicketsPerSaturday": 180,
  "peakHour": 22,
  "selloutRate": 0.85,
  "customerReturnRate": 35,
  "updatedAt": "2025-12-28T23:00:00Z"
}
```

**Ejemplo de documento WEEK:**
```json
{
  "pk": "BUSINESS#bar-la-estrella",
  "sk": "WEEK#2025-W52",
  "ticketsSold": 890,
  "revenue": 45000,
  "checkIns": 820,
  "topEvent": "Noche de Karaoke",
  "avgTicketPrice": 50.56
}
```

---

## Tabla 2: `sales-history`
### 🎯 Propósito: Registro de Transacciones

**¿Qué guarda?**
- Cada venta individual (para auditoría)
- Agregados diarios (para reportes)
- Historial completo de transacciones

**¿Por qué separada?**
- Se escribe MUCHO (cada compra de ticket)
- Puede crecer muy rápido (miles de registros)
- Tiene TTL para limpiar datos viejos automáticamente
- Patrón de acceso diferente (por fecha, por negocio)

**Estructura:**

| PK (Partition Key) | SK (Sort Key) | Contenido |
|--------------------|---------------|-----------|
| `BUSINESS#bar-123` | `SALE#2025-12-28T22:15:00Z` | Venta individual |
| `BUSINESS#bar-123` | `SALE#2025-12-28T22:16:30Z` | Otra venta |
| `BUSINESS#bar-123` | `DAY#2025-12-28` | Agregado del día |

**Ejemplo de documento SALE:**
```json
{
  "pk": "BUSINESS#bar-la-estrella",
  "sk": "SALE#2025-12-28T22:15:00Z",
  "saleId": "sale-abc123",
  "saleDate": "2025-12-28",
  "ticketType": "VIP",
  "quantity": 2,
  "unitPrice": 75,
  "totalAmount": 150,
  "buyerWallet": "0x1234...",
  "paymentTxHash": "0xabc...",
  "movementTxHash": "0xdef...",
  "expiresAt": 1743379200
}
```

**Ejemplo de documento DAY (agregado):**
```json
{
  "pk": "BUSINESS#bar-la-estrella",
  "sk": "DAY#2025-12-28",
  "saleDate": "2025-12-28",
  "totalSales": 45,
  "totalRevenue": 3375,
  "avgTicketPrice": 75,
  "peakHour": 22,
  "checkIns": 42
}
```

**GSI (Global Secondary Index):** `SaleDateIndex`
- Permite buscar TODAS las ventas de un día específico (cross-business)
- Útil para reportes globales de la plataforma

---

## Tabla 3: `ai-conversations`
### 🎯 Propósito: Memoria de la IA

**¿Qué guarda?**
- Preguntas que el admin hizo a la IA
- Recomendaciones que la IA dio
- Feedback del admin (aceptó/rechazó la sugerencia)

**¿Por qué separada?**
- Permite a la IA "recordar" conversaciones anteriores
- Mejora las recomendaciones futuras
- Tiene TTL agresivo (90 días) - no necesitamos historial eterno
- Patrón de acceso muy específico (últimas N conversaciones)

**Estructura:**

| PK (Partition Key) | SK (Sort Key) | Contenido |
|--------------------|---------------|-----------|
| `BUSINESS#bar-123` | `CONV#2025-12-28T22:00:00Z` | Conversación 1 |
| `BUSINESS#bar-123` | `CONV#2025-12-28T22:30:00Z` | Conversación 2 |

**Ejemplo de documento:**
```json
{
  "pk": "BUSINESS#bar-la-estrella",
  "sk": "CONV#2025-12-28T22:00:00Z",
  "question": "¿Cuántos tickets debo generar para el viernes?",
  "recommendation": "Basándome en tus datos históricos donde vendes en promedio 145 tickets los viernes, y considerando que este es el último viernes del año, te recomiendo generar 175 tickets (20% más que el promedio).",
  "feedback": "accepted",
  "context": {
    "metricsUsed": true,
    "historyWeeks": 4
  },
  "expiresAt": 1751328000
}
```

---

## 🔄 Cómo Fluyen los Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE COMPRA                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Se registra en sales-history (SALE#timestamp)               │
│  2. Al final del día, se actualiza DAY# en sales-history        │
│  3. Al final de la semana, se actualiza WEEK# en business-metrics│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     ADMIN PREGUNTA A LA IA                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Se lee METRICS de business-metrics                          │
│  2. Se leen últimas WEEK# de business-metrics                   │
│  3. Se leen últimas CONV# de ai-conversations                   │
│  4. Se genera respuesta con Bedrock                             │
│  5. Se guarda nueva CONV# en ai-conversations                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💰 Costos Estimados

| Tabla | Lecturas/día | Escrituras/día | Costo mensual |
|-------|--------------|----------------|---------------|
| business-metrics | ~100 | ~10 | ~$0.01 |
| sales-history | ~50 | ~500 | ~$0.05 |
| ai-conversations | ~100 | ~20 | ~$0.01 |
| **TOTAL** | | | **~$0.07/mes** |

*Con PAY_PER_REQUEST, solo pagas por lo que usas. El free tier cubre 25 GB y 200M requests/mes.*

---

## 🤔 ¿Por qué no una sola tabla?

**Single-table design** es válido en DynamoDB, pero para este proyecto:

1. **Claridad**: 3 tablas = más fácil de entender y debuggear
2. **TTL diferente**: Ventas se guardan más tiempo que conversaciones
3. **Escalamiento independiente**: Si ventas explota, no afecta a métricas
4. **Hackathon**: Más rápido de implementar y explicar a los jueces

Para producción podrías consolidar, pero para el hackathon esto es más pragmático.

---

## 📚 Referencias

- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Single-table vs Multi-table](https://www.alexdebrie.com/posts/dynamodb-single-table/)
