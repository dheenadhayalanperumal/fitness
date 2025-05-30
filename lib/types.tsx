export interface Exercise {
  id: string
  name: string
  category: 'strength' | 'cardio' | 'flexibility' | 'sports' | 'other'
  caloriesPerMinute: number
}

export interface ExerciseSet {
  id: string
  reps?: number
  weight?: number
  duration?: number
  distance?: number
}

export interface WorkoutExercise {
  id: string
  exerciseId: string
  exerciseName: string
  category: Exercise['category']
  sets: ExerciseSet[]
  caloriesBurned: number
}

export interface WorkoutEntry {
  id: string
  name: string
  exercises: WorkoutExercise[]
  duration: number
  caloriesBurned: number
  date: string
  notes?: string
  timestamp: number
}

// Add JSX namespace for intrinsic elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>
      span: React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>
      h1: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>
      h2: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>
      h3: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>
      h4: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>
      p: React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>
      header: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      main: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
    }
  }
} 