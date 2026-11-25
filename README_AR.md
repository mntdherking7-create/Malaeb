# MALAEb V1 – ملاعب

منصة رياضية عربية لعرض جدول المباريات والنتائج وروابط القنوات الرسمية المرخّصة.

## ما الذي يعمل في هذه النسخة؟
- واجهة عربية RTL متجاوبة للهاتف والكمبيوتر.
- صفحات الرئيسية والمباريات والمباشر والقنوات.
- لوحة إدارة مع تسجيل دخول Supabase Auth.
- إضافة وحذف المباريات والقنوات من لوحة الإدارة.
- سياسات قاعدة بيانات RLS: القراءة العامة للمحتوى، والكتابة لحسابات الإدارة المعتمدة فقط.
- بيانات تجريبية موسومة بوضوح إلى أن يتم ربط قاعدة البيانات.

## المتطلبات
- Node.js إصدار 20 أو أحدث.
- حساب Cloudflare.
- حساب Supabase.
- حساب GitHub للنشر المستمر (مستحسن).

## 1) تشغيل محلي
```bash
npm install
cp .env.example .env.local
npm run dev
```
افتح الرابط الذي يظهر في الطرفية (غالباً http://localhost:5173).

## 2) إعداد Supabase
1. أنشئ مشروعاً جديداً في Supabase.
2. افتح SQL Editor.
3. انسخ محتوى `supabase/schema.sql` ونفّذه.
4. من Authentication > Users أنشئ مستخدم المدير بالبريد وكلمة مرور قوية.
5. انسخ UUID الخاص بالمستخدم، ثم نفّذ:
```sql
insert into public.admin_users (user_id)
values ('ضع-UUID-حساب-المدير-هنا');
```
6. من Project Settings / API انسخ Project URL و Publishable key.
7. ضع القيم في `.env.local`:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```
8. أعد تشغيل `npm run dev`.

مهم: لا تضع `service_role` أو أي secret key في الواجهة أو في متغير يبدأ بـ `VITE_`. استخدم Publishable key فقط. صلاحيات الإدارة تُفرض من قاعدة البيانات عبر RLS، وليس بمجرد إخفاء لوحة التحكم.

## 3) بناء نسخة النشر
```bash
npm run build
```
ينتج الموقع النهائي في مجلد `dist`.

## 4) النشر على Cloudflare Pages
1. ارفع المشروع إلى مستودع GitHub.
2. افتح Cloudflare Dashboard > Workers & Pages.
3. اختر Create application > Pages > Connect to Git.
4. اختر مستودع MALAEb.
5. إعدادات البناء:
   - Framework preset: Vite
   - Build command: `npm run build`
   - Build output directory: `dist`
6. أضف متغيرات البيئة التالية في إعدادات Pages لكل من Production و Preview:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
7. ابدأ النشر. سيعطيك Cloudflare رابطاً مجانياً على نطاق `*.pages.dev`.

## 5) إدارة القنوات
أضف فقط:
- رابط موقع القناة الرسمي، أو
- رابط تضمين توفره القناة صراحة وتسمح شروطها باستخدامه.

لا ترفع بثاً أو تعِد توزيعه دون إذن. حقل embed_url محفوظ للتطوير اللاحق، ولا يعرض تلقائياً في هذه النسخة.

## 6) النتائج والمواعيد الحقيقية
النسخة الحالية لا تتصل بمزود نتائج بعد. لربط بيانات حقيقية:
- اختر مزود بيانات رياضية مرخصاً يسمح باستخدام البيانات في موقع عام.
- احتفظ بمفتاح API في Worker/Backend أو وظيفة وسيطة، وليس داخل React أو GitHub.
- أضف نقطة API وسيطة تجلب المباريات وتحدّث جدول `matches`.
- راجع شروط الاستخدام، حدود الطلبات، وتغطية البطولات قبل الاشتراك.

## 7) ملاحظات مهمة
- هذه النسخة ليست تطبيق بث فيديو؛ إنها دليل رياضي وروابط رسمية.
- لا توجد إشعارات Push مفعلة بعد؛ يلزم إعداد Service Worker وخادم إرسال آمن.
- راجع حدود الخطط المجانية لدى Cloudflare وSupabase قبل الإطلاق العام.
- لا تستخدم بيانات العرض التجريبية باعتبارها مواعيد أو نتائج حقيقية.
