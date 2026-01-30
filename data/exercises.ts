import { WorkoutExercise } from "@/types/fitness";

export const exerciseDatabase: Record<string, WorkoutExercise[]> = {
  chest: [
    {
      id: "bench-press",
      name: "Bench Press",
      sets: 4,
      reps: "8-12",
      rest: 90,
      muscleGroup: "Chest",
      equipment: ["barbell", "bench"],
      videoUrl: "https://www.youtube.com/watch?v=rT7DgCr-3pg",
      description: "Lie on a flat bench and press the barbell up from chest level. Keep your feet planted and maintain a slight arch in your lower back.",
      recommendedWeight: {
        male: {
          beginner: "40-50kg",
          intermediate: "60-80kg",
          advanced: "90-120kg"
        },
        female: {
          beginner: "20-30kg",
          intermediate: "35-50kg",
          advanced: "55-70kg"
        }
      }
    },
    {
      id: "incline-press",
      name: "Incline Dumbbell Press",
      sets: 3,
      reps: "10-12",
      rest: 75,
      muscleGroup: "Chest",
      equipment: ["dumbbells", "bench"],
      videoUrl: "https://www.youtube.com/watch?v=8iPEnn-ltC8",
      description: "Set the bench to 30-45 degrees. Press dumbbells up while keeping your shoulders back and chest up. Focus on upper chest contraction.",
      recommendedWeight: {
        male: {
          beginner: "8-12kg each",
          intermediate: "14-20kg each",
          advanced: "22-30kg each"
        },
        female: {
          beginner: "4-6kg each",
          intermediate: "8-12kg each",
          advanced: "14-18kg each"
        }
      }
    },
    {
      id: "pushups",
      name: "Push-ups",
      sets: 3,
      reps: "15-20",
      rest: 60,
      muscleGroup: "Chest",
      equipment: [],
      videoUrl: "https://www.youtube.com/watch?v=IODxDxX7oi4",
      description: "Start in a plank position with hands shoulder-width apart. Lower your body until chest nearly touches the ground, then push back up.",
      recommendedWeight: {
        male: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight + 10-20kg"
        },
        female: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight + 5-10kg"
        }
      }
    },
    {
      id: "wide-pushups",
      name: "Wide Push-ups",
      sets: 3,
      reps: "12-15",
      rest: 60,
      muscleGroup: "Chest",
      equipment: [],
      videoUrl: "https://www.youtube.com/watch?v=KYIPC75rSQg",
      description: "Push-ups with hands placed wider than shoulder-width to emphasize chest muscles.",
      recommendedWeight: {
        male: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        },
        female: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        }
      }
    },
    {
      id: "diamond-pushups",
      name: "Diamond Push-ups",
      sets: 3,
      reps: "8-12",
      rest: 60,
      muscleGroup: "Chest",
      equipment: [],
      videoUrl: "https://www.youtube.com/watch?v=J0DnG1_S92I",
      description: "Push-ups with hands close together forming a diamond shape. Targets triceps and inner chest.",
      recommendedWeight: {
        male: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        },
        female: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        }
      }
    },
    {
      id: "decline-pushups",
      name: "Decline Push-ups",
      sets: 3,
      reps: "10-15",
      rest: 60,
      muscleGroup: "Chest",
      equipment: [],
      videoUrl: "https://www.youtube.com/watch?v=SKPab2YC8BE",
      description: "Push-ups with feet elevated on a chair or bench. Targets upper chest.",
      recommendedWeight: {
        male: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        },
        female: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        }
      }
    },
    {
      id: "dumbbell-flyes",
      name: "Dumbbell Flyes",
      sets: 3,
      reps: "12-15",
      rest: 60,
      muscleGroup: "Chest",
      equipment: ["dumbbells"],
      videoUrl: "https://www.youtube.com/watch?v=eozdVDA78K0",
      description: "Lie on a bench with dumbbells. Open arms wide to the sides, then bring them together above your chest.",
      recommendedWeight: {
        male: {
          beginner: "6-10kg each",
          intermediate: "12-16kg each",
          advanced: "18-24kg each"
        },
        female: {
          beginner: "3-5kg each",
          intermediate: "6-10kg each",
          advanced: "12-16kg each"
        }
      }
    },
  ],
  back: [
    {
      id: "pullups",
      name: "Pull-ups",
      sets: 4,
      reps: "6-10",
      rest: 90,
      muscleGroup: "Back",
      equipment: ["pullup-bar"],
      videoUrl: "https://www.youtube.com/watch?v=eGo4IYlbE5g",
      description: "Hang from a pull-up bar with an overhand grip. Pull yourself up until your chin is above the bar, then lower down with control.",
      recommendedWeight: {
        male: {
          beginner: "Bodyweight (assisted)",
          intermediate: "Bodyweight",
          advanced: "Bodyweight + 10-20kg"
        },
        female: {
          beginner: "Bodyweight (assisted)",
          intermediate: "Bodyweight",
          advanced: "Bodyweight + 5-10kg"
        }
      }
    },
    {
      id: "inverted-rows",
      name: "Inverted Rows",
      sets: 3,
      reps: "10-15",
      rest: 75,
      muscleGroup: "Back",
      equipment: [],
      videoUrl: "https://www.youtube.com/watch?v=hXTc1mDnZCw",
      description: "Use a sturdy table or low bar. Lie underneath and pull your chest up to the bar.",
      recommendedWeight: {
        male: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        },
        female: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        }
      }
    },
    {
      id: "superman",
      name: "Superman",
      sets: 3,
      reps: "12-15",
      rest: 60,
      muscleGroup: "Back",
      equipment: [],
      videoUrl: "https://www.youtube.com/watch?v=cc6UVRS7PW4",
      description: "Lie face down, extend arms and legs, then lift them off the ground simultaneously.",
      recommendedWeight: {
        male: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        },
        female: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        }
      }
    },
    {
      id: "reverse-snow-angels",
      name: "Reverse Snow Angels",
      sets: 3,
      reps: "10-12",
      rest: 60,
      muscleGroup: "Back",
      equipment: [],
      videoUrl: "https://www.youtube.com/watch?v=4Z3BM3JnZuo",
      description: "Lie face down, lift arms and make circular motions like snow angels to work upper back.",
      recommendedWeight: {
        male: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        },
        female: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        }
      }
    },
    {
      id: "rows",
      name: "Barbell Rows",
      sets: 4,
      reps: "8-12",
      rest: 75,
      muscleGroup: "Back",
      equipment: ["barbell"],
      videoUrl: "https://www.youtube.com/watch?v=FWJR5Ve8bnQ",
      description: "Bend at the hips and knees, keeping your back straight. Pull the barbell to your lower chest, squeezing your shoulder blades together.",
      recommendedWeight: {
        male: {
          beginner: "40-50kg",
          intermediate: "60-80kg",
          advanced: "90-120kg"
        },
        female: {
          beginner: "20-30kg",
          intermediate: "35-50kg",
          advanced: "55-75kg"
        }
      }
    },
    {
      id: "dumbbell-rows",
      name: "Dumbbell Rows",
      sets: 3,
      reps: "10-12",
      rest: 75,
      muscleGroup: "Back",
      equipment: ["dumbbells"],
      videoUrl: "https://www.youtube.com/watch?v=pYcpY20QaE8",
      description: "Support yourself on a bench with one hand. Row a dumbbell up to your hip, keeping your elbow close to your body.",
      recommendedWeight: {
        male: {
          beginner: "10-15kg",
          intermediate: "18-25kg",
          advanced: "28-40kg"
        },
        female: {
          beginner: "5-8kg",
          intermediate: "10-15kg",
          advanced: "18-25kg"
        }
      }
    },
    {
      id: "lat-pulldown",
      name: "Lat Pulldown",
      sets: 3,
      reps: "10-12",
      rest: 60,
      muscleGroup: "Back",
      equipment: ["cable-machine"],
      videoUrl: "https://www.youtube.com/watch?v=CAwf7n6Luuc",
      description: "Sit at a lat pulldown machine. Pull the bar down to your upper chest while keeping your torso upright and squeezing your lats.",
      recommendedWeight: {
        male: {
          beginner: "30-40kg",
          intermediate: "50-70kg",
          advanced: "80-100kg"
        },
        female: {
          beginner: "15-25kg",
          intermediate: "30-45kg",
          advanced: "50-65kg"
        }
      }
    },
  ],
  legs: [
    {
      id: "squats",
      name: "Squats",
      sets: 4,
      reps: "8-12",
      rest: 120,
      muscleGroup: "Legs",
      equipment: ["barbell"],
      videoUrl: "https://www.youtube.com/watch?v=ultWZbUMPL8",
      description: "Place the barbell on your upper back. Squat down until thighs are parallel to the ground, keeping your chest up and knees tracking over toes.",
      recommendedWeight: {
        male: {
          beginner: "50-70kg",
          intermediate: "80-110kg",
          advanced: "120-160kg"
        },
        female: {
          beginner: "30-40kg",
          intermediate: "50-70kg",
          advanced: "80-100kg"
        }
      }
    },
    {
      id: "goblet-squats",
      name: "Goblet Squats",
      sets: 3,
      reps: "12-15",
      rest: 75,
      muscleGroup: "Legs",
      equipment: ["dumbbells"],
      videoUrl: "https://www.youtube.com/watch?v=MeIiIdhvXT4",
      description: "Hold a dumbbell close to your chest. Squat down keeping your chest up and elbows inside your knees.",
      recommendedWeight: {
        male: {
          beginner: "10-15kg",
          intermediate: "18-25kg",
          advanced: "28-40kg"
        },
        female: {
          beginner: "6-10kg",
          intermediate: "12-18kg",
          advanced: "20-30kg"
        }
      }
    },
    {
      id: "lunges",
      name: "Lunges",
      sets: 3,
      reps: "12-15",
      rest: 75,
      muscleGroup: "Legs",
      equipment: ["dumbbells"],
      videoUrl: "https://www.youtube.com/watch?v=QOVaHwm-Q6U",
      description: "Step forward with one leg, lowering your hips until both knees are bent at 90 degrees. Push back to starting position and alternate legs.",
      recommendedWeight: {
        male: {
          beginner: "8-12kg each",
          intermediate: "14-20kg each",
          advanced: "22-30kg each"
        },
        female: {
          beginner: "4-8kg each",
          intermediate: "10-14kg each",
          advanced: "16-22kg each"
        }
      }
    },
    {
      id: "bodyweight-squats",
      name: "Bodyweight Squats",
      sets: 3,
      reps: "15-20",
      rest: 60,
      muscleGroup: "Legs",
      equipment: [],
      videoUrl: "https://www.youtube.com/watch?v=aclHkVaku9U",
      description: "Stand with feet shoulder-width apart. Squat down keeping your chest up and weight on your heels. No equipment needed.",
      recommendedWeight: {
        male: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        },
        female: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        }
      }
    },
    {
      id: "bulgarian-split-squat",
      name: "Bulgarian Split Squat",
      sets: 3,
      reps: "12-15",
      rest: 75,
      muscleGroup: "Legs",
      equipment: [],
      videoUrl: "https://www.youtube.com/watch?v=2C-uNgKwPLE",
      description: "Rear foot elevated on a chair, lower down into a lunge position. Great for quads and glutes.",
      recommendedWeight: {
        male: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        },
        female: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        }
      }
    },
    {
      id: "jump-squats",
      name: "Jump Squats",
      sets: 3,
      reps: "10-15",
      rest: 75,
      muscleGroup: "Legs",
      equipment: [],
      videoUrl: "https://www.youtube.com/watch?v=A-cFYWvaHr0",
      description: "Explosive squat with a jump at the top. Great for power and fat burning.",
      recommendedWeight: {
        male: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        },
        female: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        }
      }
    },
    {
      id: "wall-sit",
      name: "Wall Sit",
      sets: 3,
      reps: "30-60 sec",
      rest: 60,
      muscleGroup: "Legs",
      equipment: [],
      videoUrl: "https://www.youtube.com/watch?v=y-wV4Venusw",
      description: "Lean against a wall with knees at 90 degrees. Hold position for time.",
      recommendedWeight: {
        male: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        },
        female: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        }
      }
    },
    {
      id: "glute-bridges",
      name: "Glute Bridges",
      sets: 3,
      reps: "15-20",
      rest: 60,
      muscleGroup: "Legs",
      equipment: [],
      videoUrl: "https://www.youtube.com/watch?v=wPM8icPu6H8",
      description: "Lie on back with knees bent, lift hips up by squeezing glutes. Great for posterior chain.",
      recommendedWeight: {
        male: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        },
        female: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        }
      }
    },
    {
      id: "single-leg-deadlift",
      name: "Single Leg Deadlift",
      sets: 3,
      reps: "10-12",
      rest: 60,
      muscleGroup: "Legs",
      equipment: [],
      videoUrl: "https://www.youtube.com/watch?v=Zfr6wizR8rs",
      description: "Stand on one leg, hinge at the hip and reach down while extending the other leg back. Balance and hamstring work.",
      recommendedWeight: {
        male: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        },
        female: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        }
      }
    },
    {
      id: "leg-press",
      name: "Leg Press",
      sets: 3,
      reps: "10-15",
      rest: 90,
      muscleGroup: "Legs",
      equipment: ["leg-press-machine"],
      videoUrl: "https://www.youtube.com/watch?v=IZxyjW7MPJQ",
      description: "Sit on the leg press machine with feet shoulder-width apart. Push the platform away by extending your legs, then slowly return to starting position.",
      recommendedWeight: {
        male: {
          beginner: "60-90kg",
          intermediate: "100-150kg",
          advanced: "170-250kg"
        },
        female: {
          beginner: "40-60kg",
          intermediate: "70-100kg",
          advanced: "110-150kg"
        }
      }
    },
  ],
  shoulders: [
    {
      id: "overhead-press",
      name: "Overhead Press",
      sets: 4,
      reps: "8-12",
      rest: 90,
      muscleGroup: "Shoulders",
      equipment: ["barbell"],
      videoUrl: "https://www.youtube.com/watch?v=QSxuqraC3O0",
      description: "Stand with feet shoulder-width apart. Press the barbell overhead from shoulder level until arms are fully extended. Lower with control.",
      recommendedWeight: {
        male: {
          beginner: "30-40kg",
          intermediate: "50-70kg",
          advanced: "80-100kg"
        },
        female: {
          beginner: "15-25kg",
          intermediate: "30-40kg",
          advanced: "45-60kg"
        }
      }
    },
    {
      id: "pike-pushups",
      name: "Pike Push-ups",
      sets: 3,
      reps: "10-15",
      rest: 75,
      muscleGroup: "Shoulders",
      equipment: [],
      videoUrl: "https://www.youtube.com/watch?v=x4YNjHHyqn8",
      description: "Start in downward dog position. Lower your head to the ground and push back up. Targets shoulders.",
      recommendedWeight: {
        male: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        },
        female: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        }
      }
    },
    {
      id: "handstand-pushups",
      name: "Handstand Push-ups (Wall Supported)",
      sets: 3,
      reps: "5-10",
      rest: 90,
      muscleGroup: "Shoulders",
      equipment: [],
      videoUrl: "https://www.youtube.com/watch?v=tQhrk6WMcKw",
      description: "Kick up to a handstand against a wall. Lower your head to the ground and press back up. Advanced move.",
      recommendedWeight: {
        male: {
          beginner: "Bodyweight (assisted)",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        },
        female: {
          beginner: "Bodyweight (assisted)",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        }
      }
    },
    {
      id: "dumbbell-press",
      name: "Dumbbell Shoulder Press",
      sets: 3,
      reps: "10-12",
      rest: 75,
      muscleGroup: "Shoulders",
      equipment: ["dumbbells"],
      videoUrl: "https://www.youtube.com/watch?v=qEwKCR5JCog",
      description: "Sit or stand with dumbbells at shoulder height. Press them overhead until arms are extended, then lower with control.",
      recommendedWeight: {
        male: {
          beginner: "8-12kg each",
          intermediate: "14-20kg each",
          advanced: "22-30kg each"
        },
        female: {
          beginner: "4-6kg each",
          intermediate: "8-12kg each",
          advanced: "14-18kg each"
        }
      }
    },
    {
      id: "lateral-raises",
      name: "Lateral Raises",
      sets: 3,
      reps: "12-15",
      rest: 60,
      muscleGroup: "Shoulders",
      equipment: ["dumbbells"],
      videoUrl: "https://www.youtube.com/watch?v=3VcKaXpzqRo",
      description: "Stand with dumbbells at your sides. Raise them out to the sides until arms are parallel to the ground, then lower slowly.",
      recommendedWeight: {
        male: {
          beginner: "4-6kg each",
          intermediate: "8-12kg each",
          advanced: "14-18kg each"
        },
        female: {
          beginner: "2-4kg each",
          intermediate: "5-8kg each",
          advanced: "10-12kg each"
        }
      }
    },
    {
      id: "front-raises",
      name: "Front Raises",
      sets: 3,
      reps: "12-15",
      rest: 60,
      muscleGroup: "Shoulders",
      equipment: ["dumbbells"],
      videoUrl: "https://www.youtube.com/watch?v=2yjwXTZQDDI",
      description: "Hold dumbbells in front of your thighs. Raise them forward and up to shoulder level, keeping a slight bend in your elbows.",
      recommendedWeight: {
        male: {
          beginner: "4-6kg each",
          intermediate: "8-12kg each",
          advanced: "14-18kg each"
        },
        female: {
          beginner: "2-4kg each",
          intermediate: "5-8kg each",
          advanced: "10-12kg each"
        }
      }
    },
  ],
  arms: [
    {
      id: "bicep-curls",
      name: "Bicep Curls",
      sets: 3,
      reps: "10-12",
      rest: 60,
      muscleGroup: "Biceps",
      equipment: ["dumbbells"],
      videoUrl: "https://www.youtube.com/watch?v=ykJmrZ5v0Oo",
      description: "Stand with dumbbells at your sides, palms facing forward. Curl the weights up to shoulder level, keeping your elbows stationary.",
      recommendedWeight: {
        male: {
          beginner: "6-10kg each",
          intermediate: "12-16kg each",
          advanced: "18-24kg each"
        },
        female: {
          beginner: "3-5kg each",
          intermediate: "6-10kg each",
          advanced: "12-16kg each"
        }
      }
    },
    {
      id: "chin-ups",
      name: "Chin-ups",
      sets: 3,
      reps: "6-10",
      rest: 75,
      muscleGroup: "Biceps",
      equipment: ["pullup-bar"],
      videoUrl: "https://www.youtube.com/watch?v=brhWuCQ17FI",
      description: "Hang from a bar with palms facing you. Pull yourself up focusing on biceps.",
      recommendedWeight: {
        male: {
          beginner: "Bodyweight (assisted)",
          intermediate: "Bodyweight",
          advanced: "Bodyweight + 10kg"
        },
        female: {
          beginner: "Bodyweight (assisted)",
          intermediate: "Bodyweight",
          advanced: "Bodyweight + 5kg"
        }
      }
    },
    {
      id: "tricep-dips",
      name: "Tricep Dips",
      sets: 3,
      reps: "10-15",
      rest: 60,
      muscleGroup: "Triceps",
      equipment: ["dip-bars"],
      videoUrl: "https://www.youtube.com/watch?v=2z8JmcrW-As",
      description: "Support yourself on parallel bars. Lower your body by bending your elbows until your upper arms are parallel to the ground, then push back up.",
      recommendedWeight: {
        male: {
          beginner: "Bodyweight (assisted)",
          intermediate: "Bodyweight",
          advanced: "Bodyweight + 10-20kg"
        },
        female: {
          beginner: "Bodyweight (assisted)",
          intermediate: "Bodyweight",
          advanced: "Bodyweight + 5-10kg"
        }
      }
    },
    {
      id: "bench-dips",
      name: "Bench/Chair Dips",
      sets: 3,
      reps: "12-15",
      rest: 60,
      muscleGroup: "Triceps",
      equipment: [],
      videoUrl: "https://www.youtube.com/watch?v=0326dy_-CzM",
      description: "Use a chair or bench behind you. Support your weight on your hands and lower your body down then push back up.",
      recommendedWeight: {
        male: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        },
        female: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        }
      }
    },
    {
      id: "close-grip-pushups",
      name: "Close Grip Push-ups",
      sets: 3,
      reps: "10-15",
      rest: 60,
      muscleGroup: "Triceps",
      equipment: [],
      videoUrl: "https://www.youtube.com/watch?v=bTsCz0kCNJI",
      description: "Push-ups with hands closer together to emphasize triceps.",
      recommendedWeight: {
        male: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        },
        female: {
          beginner: "Bodyweight",
          intermediate: "Bodyweight",
          advanced: "Bodyweight"
        }
      }
    },
    {
      id: "hammer-curls",
      name: "Hammer Curls",
      sets: 3,
      reps: "10-12",
      rest: 60,
      muscleGroup: "Biceps",
      equipment: ["dumbbells"],
      videoUrl: "https://www.youtube.com/watch?v=zC3nLlEvin4",
      description: "Hold dumbbells with palms facing each other. Curl the weights up while maintaining the neutral grip throughout the movement.",
      recommendedWeight: {
        male: {
          beginner: "6-10kg each",
          intermediate: "12-16kg each",
          advanced: "18-24kg each"
        },
        female: {
          beginner: "3-5kg each",
          intermediate: "6-10kg each",
          advanced: "12-16kg each"
        }
      }
    },
    {
      id: "tricep-extensions",
      name: "Tricep Extensions",
      sets: 3,
      reps: "12-15",
      rest: 60,
      muscleGroup: "Triceps",
      equipment: ["dumbbells"],
      videoUrl: "https://www.youtube.com/watch?v=_gsUck-7M74",
      description: "Hold a dumbbell overhead with both hands. Lower it behind your head by bending elbows, then extend back up.",
      recommendedWeight: {
        male: {
          beginner: "8-12kg",
          intermediate: "14-20kg",
          advanced: "22-30kg"
        },
        female: {
          beginner: "4-8kg",
          intermediate: "10-14kg",
          advanced: "16-22kg"
        }
      }
    },
  ],
};

export const workoutTemplates = {
  fullBody: [
    {
      day: "Monday",
      name: "Full Body A",
      muscleGroups: ["chest", "back", "legs"],
    },
    {
      day: "Wednesday",
      name: "Full Body B",
      muscleGroups: ["shoulders", "legs", "arms"],
    },
    {
      day: "Friday",
      name: "Full Body C",
      muscleGroups: ["chest", "back", "arms"],
    },
  ],
  upperLower: [
    {
      day: "Monday",
      name: "Upper Body",
      muscleGroups: ["chest", "back", "shoulders"],
    },
    {
      day: "Tuesday",
      name: "Lower Body",
      muscleGroups: ["legs"],
    },
    {
      day: "Thursday",
      name: "Upper Body",
      muscleGroups: ["chest", "back", "arms"],
    },
    {
      day: "Friday",
      name: "Lower Body",
      muscleGroups: ["legs"],
    },
  ],
  pushPullLegs: [
    {
      day: "Monday",
      name: "Push",
      muscleGroups: ["chest", "shoulders", "arms"],
    },
    {
      day: "Tuesday",
      name: "Pull",
      muscleGroups: ["back", "arms"],
    },
    {
      day: "Wednesday",
      name: "Legs",
      muscleGroups: ["legs"],
    },
    {
      day: "Thursday",
      name: "Push",
      muscleGroups: ["chest", "shoulders", "arms"],
    },
    {
      day: "Friday",
      name: "Pull",
      muscleGroups: ["back", "arms"],
    },
    {
      day: "Saturday",
      name: "Legs",
      muscleGroups: ["legs"],
    },
  ],
};
