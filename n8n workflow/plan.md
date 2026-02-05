

تمام 👌
كده نضبط الخطوات **مخصوص لـ Evolution API + n8n** بالترتيب العملي الصح، من غير لف.

---

# 🔗 Workflow n8n مع Evolution API (Step by Step)

## المرحلة 0️⃣ – تأكيد الجاهزية

لازم يبقى عندك:

* ✅ Evolution API شغال
* ✅ Instance Name (مثلاً: `laapak`)
* ✅ API Key
* ✅ Webhook مفعل في Evolution
* ✅ n8n شغال ومستقبل Webhooks

---

# المرحلة 1️⃣ – استقبال رسالة واتساب

## 1) Webhook Node (Incoming Message)

**Node:** Webhook
**Method:** `POST`
**Path:**

```
/evolution/incoming
```

### Payload اللي Evolution بيبعته (المهم):

```json
{
  "instance": "laapak",
  "data": {
    "key": {
      "remoteJid": "201xxxxxxxx@c.us"
    },
    "message": {
      "conversation": "عايز اعرف حالة الاوردر"
    }
  }
}
```

---

## 2) Function Node – Normalize Data

**Node:** Function
تنضيف وتوحيد الداتا:

```js
const jid = $json.data.key.remoteJid;
const phone = jid.replace('@c.us', '');
const message =
  $json.data.message?.conversation ||
  $json.data.message?.extendedTextMessage?.text ||
  '';

return [{
  phone,
  message: message.trim().toLowerCase()
}];
```

---

# المرحلة 2️⃣ – ربط الرسالة بالعميل (Woo)

## 3) HTTP Request – Get Customer (Woo)

**Method:** GET

```
/wp-json/wc/v3/customers?search={{$json.phone}}
```

* Auth: Woo API Key / Secret

---

## 4) IF Node – Customer Exists?

**Condition:**

```
{{$json.length > 0}}
```

* ✅ True → عميل قديم
* ❌ False → عميل جديد

---

## 5) HTTP Request – Get Orders (لو قديم)

```
/wp-json/wc/v3/orders?customer={{customer_id}}&status=processing
```

---

# المرحلة 3️⃣ – قراءة سياق الشات

## 6) Database Node – Last Messages

```sql
SELECT message
FROM whatsapp_messages
WHERE phone = ?
ORDER BY created_at DESC
LIMIT 5;
```

---

## 7) Function Node – Intent Detection (Rules)

```js
const msg = $json.message;

if (msg.includes("اوردر") || msg.includes("طلب"))
  return { intent: "order_status" };

if (msg.includes("سعر") || msg.includes("بكام"))
  return { intent: "price" };

if (msg.includes("مش") || msg.includes("شكوى"))
  return { intent: "complaint" };

if (msg.includes("اكلم") || msg.includes("حد"))
  return { intent: "human_request" };

return { intent: "unknown" };
```

---

# المرحلة 4️⃣ – قرار: Bot ولا إنسان؟

## 8) IF Node – Escalation Decision

Escalate لو:

* intent = `complaint`
* intent = `human_request`
* OR عدد رسائل العميل > 3

```text
TRUE  → Human Handoff
FALSE → Auto Reply
```

---

# المرحلة 5️⃣ – الرد التلقائي (Evolution)

## 9A) Database – Quick Reply

```sql
SELECT message
FROM quick_replies
WHERE intent = ?
LIMIT 1;
```

---

## 🔟A HTTP Request – Send Message (Evolution API)

**Method:** POST
**URL:**

```
/message/sendText/{{instance}}
```

**Headers:**

```
apikey: YOUR_API_KEY
```

**Body:**

```json
{
  "number": "{{phone}}",
  "text": "{{final_message}}"
}
```

---

# المرحلة 6️⃣ – تحويل لبشر (Human Handoff)

## 9B) Set Node – Handoff Message

```
تمام يا فندم 🙏  
هخلي حد من خدمة العملاء يتواصل مع حضرتك خلال دقائق
```

---

## 🔟B Send Message (Evolution API)

نفس endpoint اللي فوق.

---

## 1️⃣1️⃣B Notify Team

اختار واحد:

* Slack Node
* WhatsApp Group عبر Evolution
* Telegram

---

## 1️⃣2️⃣B Log Escalation

```sql
INSERT INTO handoff_logs (phone, reason)
VALUES (?, ?);
```

---

# المرحلة 7️⃣ – حفظ الرسائل

## 1️⃣3️⃣ Database – Save Message

```sql
INSERT INTO whatsapp_messages (phone, message, sender)
VALUES (?, ?, 'customer');
```

---

# ✅ النتيجة

دلوقتي عندك:

* n8n متوصل مباشرة بـ Evolution
* Bot فاهم:

  * مين العميل
  * عنده أوردر ولا لأ
* بيرد تلقائي لما ينفع
* وبيقف ويسلّم لإنسان صح

---

## 🔥 الخطوة الجاية (مهمة)

لو حابب نكمل:

* 🧠 Sentiment Analysis
* 🤖 LLM Intent Detection
* 🖥 Dashboard للشاتات
* 🧩 Flow JSON جاهز Import

قولّي تحب نبدأ بإيه وأنا أظبطهولك 👌
