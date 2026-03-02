# تطبيق مُلهم - تدفق البيانات وتكامل Supabase

## نظرة عامة

يستخدم مُلهم استراتيجية بيانات ثنائية الطبقة تجمع بين التخزين المحلي (AsyncStorage) والمزامنة السحابية (Supabase). هذا يضمن عمل التطبيق بدون اتصال مع الحفاظ على مزامنة البيانات عبر الأجهزة للمستخدمين المسجلين.

---

## طبقات البيانات

### الطبقة 1: الذاكرة المؤقتة المحلية (AsyncStorage)

جميع البيانات تُخزن محلياً أولاً للوصول الفوري:

| المفتاح | نوع البيانات | الوصف |
|---------|-------------|-------|
| `@mulhim_profile` | `FitnessProfile` | الملف الشخصي للياقة |
| `@mulhim_progress` | `ProgressEntry[]` | سجلات تتبع الوزن |
| `@mulhim_workout_logs` | `WorkoutLog[]` | سجلات التمارين المكتملة |
| `@mulhim_week_plan` | `WeeklyPlan` | خطة التمرين الأسبوعية الحالية |
| `@mulhim_nutrition` | `NutritionAssessment` | بيانات استبيان التغذية |
| `@mulhim_nutrition_plan` | `NutritionPlan` | أهداف التغذية المُنشأة |
| `@mulhim_meal_plan` | `WeeklyMealPlan` | جدول الوجبات الأسبوعي |
| `@mulhim_grocery_list` | `GroceryList` | قائمة المشتريات |
| `@mulhim_favorite_exercises` | `FavoriteExercise[]` | التمارين المحفوظة |
| `@mulhim_favorite_meals` | `FavoriteMeal[]` | الوجبات المحفوظة |
| `@mulhim_language` | `'ar' \| 'en'` | تفضيل اللغة |

### الطبقة 2: المزامنة عن بُعد (Supabase)

المستخدمون المسجلون يحصلون على مزامنة سحابية عبر خدمة `remoteFitnessRepo`:

```
services/remoteRepo.ts
├── عمليات الملف الشخصي
│   ├── upsertProfile()         # إنشاء/تحديث الملف
│   └── fetchProfile()          # جلب الملف
├── التقدم
│   ├── insertProgressEntry()   # إضافة سجل وزن
│   └── fetchProgressEntries()  # جلب سجلات الوزن
├── خطط التمرين
│   ├── saveWorkoutPlan()       # حفظ خطة التمرين
│   ├── fetchActiveWorkoutPlan() # جلب الخطة النشطة
│   └── updateSessionCompletion() # تحديث حالة الإكمال
├── سجلات التمرين
│   ├── insertWorkoutLog()      # إضافة سجل تمرين
│   └── fetchWorkoutLogs()      # جلب سجلات التمرين
├── خطط التغذية
│   ├── saveNutritionPlan()     # حفظ خطة التغذية
│   └── fetchActiveNutritionPlan() # جلب خطة التغذية النشطة
├── التمارين المفضلة
│   ├── addFavoriteExercise()   # إضافة تمرين مفضل
│   ├── removeFavoriteExercise() # حذف تمرين مفضل
│   └── fetchFavoriteExercises() # جلب التمارين المفضلة
└── الوجبات المفضلة
    ├── addFavoriteMeal()       # إضافة وجبة مفضلة
    ├── removeFavoriteMeal()    # حذف وجبة مفضلة
    └── fetchFavoriteMeals()    # جلب الوجبات المفضلة
```

---

## تسلسل الإقلاع

عند بدء التطبيق، يُنفذ `FitnessProvider.loadData()`:

```
الخطوة 1: الترطيب من AsyncStorage
  ├── تحميل جميع المفاتيح العشرة بالتوازي
  ├── تحليل JSON بأمان (مع قيم احتياطية)
  └── تعيين حالة React فوراً

الخطوة 2: (إذا كان مسجلاً) المزامنة من Supabase
  ├── جلب الملف والتقدم والسجلات والمفضلة بالتوازي
  │   (كل منها مع معالجة أخطاء فردية عبر safeFetch)
  ├── تحديث حالة React بالبيانات عن بُعد
  ├── تحديث ذاكرة AsyncStorage المؤقتة
  ├── جلب خطة التمرين (try/catch منفصل)
  ├── جلب خطة التغذية (try/catch منفصل)
  └── رفع البيانات المحلية فقط إلى Supabase إذا كانت البعيدة فارغة
```

### استراتيجية معالجة الأخطاء

- أخطاء الشبكة تُلتقط ويعود التطبيق للذاكرة المحلية
- فشل الجلب الفردي لا يمنع تحميل البيانات الأخرى
- قيمة `NETWORK_ERROR` تنتشر عبر النظام
- أخطاء Supabase تُسجل بسياق كامل (الرسالة، التفاصيل، التلميح، الكود)

---

## عمليات الكتابة

### تدفق حفظ الملف الشخصي

```
المستخدم يحفظ الملف
  ├── إذا كان مسجلاً:
  │   └── remoteFitnessRepo.upsertProfile() [try/catch]
  ├── AsyncStorage.setItem(PROFILE_KEY)
  └── setProfile(state)
```

### تدفق إكمال التمرين

```
المستخدم يبدّل اكتمال التمرين
  ├── حساب مصفوفة completedExercises الجديدة
  ├── التحقق مما إذا اكتملت جميع التمارين
  ├── إذا كان مسجلاً:
  │   └── remoteFitnessRepo.updateSessionCompletion() [إطلاق ونسيان]
  ├── تحديث حالة React
  └── AsyncStorage.setItem(WEEK_PLAN_KEY)
```

### تدفق خطة التغذية

```
المستخدم يكمل التقييم الغذائي
  ├── استخراج الوجبات المفضلة من السجل الغذائي
  ├── حفظ التقييم في AsyncStorage
  ├── إنشاء خطة التغذية (الحسابات في hooks/)
  ├── حفظ الخطة في AsyncStorage
  └── إذا كان مسجلاً:
      └── remoteFitnessRepo.saveNutritionPlan() [إطلاق ونسيان]
```

---

## مخطط قاعدة بيانات Supabase

### العلاقات بين الجداول

```
auth.users (مصادقة Supabase)
  └── user_profiles (1:1)           # الملف الشخصي
  └── progress_entries (1:عديد)     # سجلات التقدم
  └── workout_plans (1:عديد)        # خطط التمرين
  │     └── workout_sessions (1:عديد) # جلسات التمرين
  │           └── exercises (1:عديد)   # التمارين
  └── workout_logs (1:عديد)         # سجلات التمرين
  │     └── exercise_logs (1:عديد)    # سجلات التمارين الفردية
  └── nutrition_plans (1:عديد)      # خطط التغذية
  │     └── meal_plans (1:عديد)       # خطط الوجبات اليومية
  │           └── meals (1:عديد)       # الوجبات الفردية
  └── favorite_exercises (1:عديد)   # التمارين المفضلة
  └── favorite_meals (1:عديد)       # الوجبات المفضلة
```

### الأعمدة الرئيسية

**workout_plans:**
- `status`: `'active'` | `'archived'` - خطة نشطة واحدة فقط لكل مستخدم
- `generated_by`: `'ai'` - مصدر إنشاء الخطة

**workout_sessions:**
- `is_completed`: boolean - حالة إكمال الجلسة
- `completed_exercises`: text[] - مصفوفة معرفات التمارين المكتملة

**nutrition_plans:**
- `daily_calories_target`: integer - هدف السعرات المُقرّب
- `protein_g`, `carbs_g`, `fats_g`: integer - أهداف الماكروز المُقرّبة
- `diet_pattern`: text - أحد: balanced, high_protein, high_protein_carbs, moderate_low_carb

---

## المرونة الشبكية

تنفذ `remoteRepo` عدة أنماط للمرونة الشبكية:

### منطق إعادة المحاولة

```typescript
retryFetch(fn, retries = 2, delay = 1000)
```

- إعادة المحاولة حتى مرتين عند أخطاء الشبكة
- تأخير تصاعدي: 1 ثانية، 2 ثانية
- إعادة المحاولة فقط عند أخطاء `TypeError` / `Failed to fetch`
- الأخطاء غير الشبكية تنتشر فوراً

### تصنيف الأخطاء

```
أخطاء الشبكة (إعادة محاولة + عودة للذاكرة المؤقتة):
  - TypeError: Failed to fetch
  - أي TypeError

أخطاء Supabase (تسجيل + رمي):
  - PGRST116: غير موجود (يُعالج بسلاسة)
  - PGRST204: العمود غير موجود
  - 22P02: صيغة إدخال غير صالحة

أخطاء التطبيق (رمي):
  - جميع الأخطاء الأخرى
```

### دعم العمل بدون اتصال

- المستخدمون الضيوف يعملون بالكامل بدون اتصال مع AsyncStorage
- المستخدمون المسجلون يحصلون على بيانات مخزنة عند فشل الشبكة
- التغييرات المحلية لا تُوضع في قائمة انتظار للمزامنة اللاحقة
