# Audio Skill Simulator - Technical Specification

**Version:** 1.0.0
**Date:** 2025-12-07
**Status:** Draft
**Author:** KarriereHeld Development Team

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Data Model](#3-data-model)
4. [API Endpoints](#4-api-endpoints)
5. [Gemini Integration Pipeline](#5-gemini-integration-pipeline)
6. [Frontend Components](#6-frontend-components)
7. [User Flow](#7-user-flow)
8. [Configuration Examples](#8-configuration-examples)
9. [Implementation Roadmap](#9-implementation-roadmap)

---

## 1. Overview

### 1.1 Purpose

The **Audio Skill Simulator** is a new training feature that enables users to practice interview scenarios through audio-only interactions with immediate AI feedback after each question.

### 1.2 Key Differentiators

| Aspect | Roleplay Feature | Audio Skill Simulator |
|--------|------------------|----------------------|
| **Interaction** | Continuous conversation with ElevenLabs | Question-by-question with pause |
| **Feedback** | Single feedback at session end | Immediate feedback after EACH question |
| **Media** | Audio via WebSocket | Audio recording (Blob upload) |
| **Flow Control** | Linear conversation | Retry / Next per question |
| **Scenarios** | WordPress CPT | Database-driven (SQL tables) |
| **AI Engine** | ElevenLabs + Gemini | **Gemini 1.5 Flash only** (multimodal) |

### 1.3 Technical Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** WordPress REST API (PHP)
- **Database:** MySQL (WordPress WPDB)
- **AI:** Google Gemini 1.5 Flash (multimodal audio + text)
- **Audio:** Web Audio API + MediaRecorder

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                            │
├─────────────────────────────────────────────────────────────────────┤
│  SimulatorDashboard  →  SimulatorWizard  →  SimulatorSession       │
│         ↓                     ↓                    ↓                │
│  [Select Scenario]    [Fill Variables]     [Audio Recording]       │
│                       [Generate Questions]  [Immediate Feedback]   │
│                                             [Retry / Next]         │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND (WordPress REST API)                   │
├─────────────────────────────────────────────────────────────────────┤
│  GET  /simulator/scenarios          → List all scenario templates  │
│  GET  /simulator/scenarios/{id}     → Get scenario with config     │
│  POST /simulator/sessions           → Create new session           │
│  POST /simulator/sessions/{id}/questions → Generate questions      │
│  POST /simulator/sessions/{id}/answer    → Submit audio + get FB   │
│  PUT  /simulator/sessions/{id}      → Update session data          │
│  GET  /simulator/sessions           → User's session history       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATABASE (MySQL)                             │
├─────────────────────────────────────────────────────────────────────┤
│  wp_bewerbungstrainer_simulator_scenarios  (Scenario Templates)    │
│  wp_bewerbungstrainer_simulator_sessions   (User Sessions)         │
│  wp_bewerbungstrainer_simulator_answers    (Per-Question Answers)  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    AI ENGINE (Gemini 1.5 Flash)                     │
├─────────────────────────────────────────────────────────────────────┤
│  1. Question Generation: Text → JSON (questions array)             │
│  2. Answer Analysis: Audio + Text → JSON (transcript + feedback)   │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Interaction Flow

```
User                   Frontend              Backend              Gemini
  │                       │                     │                    │
  │  Select Scenario      │                     │                    │
  │──────────────────────>│                     │                    │
  │                       │  GET /scenarios/{id}│                    │
  │                       │────────────────────>│                    │
  │                       │<────────────────────│                    │
  │                       │                     │                    │
  │  Fill Variables       │                     │                    │
  │──────────────────────>│                     │                    │
  │                       │  POST /sessions     │                    │
  │                       │────────────────────>│                    │
  │                       │<────────────────────│ session_id         │
  │                       │                     │                    │
  │                       │  POST /questions    │                    │
  │                       │────────────────────>│  Generate Questions│
  │                       │                     │───────────────────>│
  │                       │                     │<───────────────────│
  │                       │<────────────────────│  questions[]       │
  │                       │                     │                    │
  │  Record Answer Q1     │                     │                    │
  │──────────────────────>│                     │                    │
  │                       │  POST /answer       │                    │
  │                       │  (audio blob)       │                    │
  │                       │────────────────────>│  Analyze Audio     │
  │                       │                     │───────────────────>│
  │                       │                     │<───────────────────│
  │<──────────────────────│<────────────────────│  transcript + FB   │
  │  Display Feedback     │                     │                    │
  │                       │                     │                    │
  │  [Retry] or [Next]    │                     │                    │
  │──────────────────────>│                     │                    │
  │        ...            │                     │                    │
```

---

## 3. Data Model

### 3.1 Database Schema (SQL)

#### Table: `wp_bewerbungstrainer_simulator_scenarios`

Stores scenario templates that administrators configure.

```sql
CREATE TABLE IF NOT EXISTS wp_bewerbungstrainer_simulator_scenarios (
    id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,

    -- Basic Information
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    icon VARCHAR(50) DEFAULT 'briefcase',
    difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'intermediate',
    category VARCHAR(100) DEFAULT NULL,

    -- AI Configuration
    system_prompt LONGTEXT NOT NULL,
    question_generation_prompt LONGTEXT DEFAULT NULL,
    feedback_prompt LONGTEXT DEFAULT NULL,

    -- Dynamic Input Configuration (JSON)
    input_configuration LONGTEXT NOT NULL,

    -- Settings
    question_count_min TINYINT UNSIGNED DEFAULT 8,
    question_count_max TINYINT UNSIGNED DEFAULT 12,
    time_limit_per_question INT DEFAULT 120,
    allow_retry TINYINT(1) DEFAULT 1,

    -- Metadata
    is_active TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY is_active (is_active),
    KEY category (category),
    KEY sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Table: `wp_bewerbungstrainer_simulator_sessions`

Stores user training sessions.

```sql
CREATE TABLE IF NOT EXISTS wp_bewerbungstrainer_simulator_sessions (
    id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,

    -- User Information
    user_id BIGINT(20) UNSIGNED NOT NULL DEFAULT 0,
    user_name VARCHAR(255) DEFAULT NULL,
    session_id VARCHAR(36) NOT NULL,

    -- Scenario Reference
    scenario_id BIGINT(20) UNSIGNED NOT NULL,

    -- Session Configuration (snapshot of wizard inputs)
    variables_json LONGTEXT DEFAULT NULL,

    -- Generated Questions (stored after generation)
    questions_json LONGTEXT DEFAULT NULL,

    -- Session Progress
    current_question_index INT DEFAULT 0,
    status ENUM('setup', 'in_progress', 'completed', 'abandoned') DEFAULT 'setup',

    -- Aggregated Results
    total_questions INT DEFAULT 0,
    completed_questions INT DEFAULT 0,
    overall_score DECIMAL(5,2) DEFAULT NULL,
    summary_feedback_json LONGTEXT DEFAULT NULL,

    -- Timestamps
    started_at DATETIME DEFAULT NULL,
    completed_at DATETIME DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY session_id (session_id),
    KEY user_id (user_id),
    KEY scenario_id (scenario_id),
    KEY status (status),
    KEY created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Table: `wp_bewerbungstrainer_simulator_answers`

Stores individual question-answer pairs with feedback.

```sql
CREATE TABLE IF NOT EXISTS wp_bewerbungstrainer_simulator_answers (
    id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,

    -- Session Reference
    session_id BIGINT(20) UNSIGNED NOT NULL,

    -- Question Information
    question_index INT NOT NULL,
    question_text TEXT NOT NULL,
    question_category VARCHAR(100) DEFAULT NULL,

    -- Answer Data
    audio_filename VARCHAR(255) DEFAULT NULL,
    audio_url TEXT DEFAULT NULL,
    audio_duration_seconds INT DEFAULT NULL,

    -- AI Analysis Results
    transcript LONGTEXT DEFAULT NULL,
    feedback_json LONGTEXT DEFAULT NULL,
    audio_analysis_json LONGTEXT DEFAULT NULL,

    -- Scoring
    content_score DECIMAL(3,1) DEFAULT NULL,
    delivery_score DECIMAL(3,1) DEFAULT NULL,
    overall_score DECIMAL(3,1) DEFAULT NULL,

    -- Retry Tracking
    attempt_number INT DEFAULT 1,
    is_final_attempt TINYINT(1) DEFAULT 1,

    -- Timestamps
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY session_id (session_id),
    KEY question_index (question_index),
    KEY is_final_attempt (is_final_attempt),

    CONSTRAINT fk_answer_session FOREIGN KEY (session_id)
        REFERENCES wp_bewerbungstrainer_simulator_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.2 Prisma Schema (Alternative Reference)

```prisma
// For reference - actual implementation uses WordPress WPDB

model SimulatorScenario {
  id                       Int       @id @default(autoincrement())
  title                    String    @db.VarChar(255)
  description              String?   @db.Text
  icon                     String    @default("briefcase") @db.VarChar(50)
  difficulty               Difficulty @default(intermediate)
  category                 String?   @db.VarChar(100)

  systemPrompt             String    @db.LongText @map("system_prompt")
  questionGenerationPrompt String?   @db.LongText @map("question_generation_prompt")
  feedbackPrompt           String?   @db.LongText @map("feedback_prompt")

  inputConfiguration       Json      @map("input_configuration")

  questionCountMin         Int       @default(8) @map("question_count_min")
  questionCountMax         Int       @default(12) @map("question_count_max")
  timeLimitPerQuestion     Int       @default(120) @map("time_limit_per_question")
  allowRetry               Boolean   @default(true) @map("allow_retry")

  isActive                 Boolean   @default(true) @map("is_active")
  sortOrder                Int       @default(0) @map("sort_order")
  createdAt                DateTime  @default(now()) @map("created_at")
  updatedAt                DateTime  @updatedAt @map("updated_at")

  sessions                 SimulatorSession[]

  @@map("wp_bewerbungstrainer_simulator_scenarios")
}

model SimulatorSession {
  id                    Int       @id @default(autoincrement())
  userId                Int       @default(0) @map("user_id")
  userName              String?   @db.VarChar(255) @map("user_name")
  sessionId             String    @unique @db.VarChar(36) @map("session_id")

  scenarioId            Int       @map("scenario_id")
  scenario              SimulatorScenario @relation(fields: [scenarioId], references: [id])

  variablesJson         Json?     @map("variables_json")
  questionsJson         Json?     @map("questions_json")

  currentQuestionIndex  Int       @default(0) @map("current_question_index")
  status                SessionStatus @default(setup)

  totalQuestions        Int       @default(0) @map("total_questions")
  completedQuestions    Int       @default(0) @map("completed_questions")
  overallScore          Decimal?  @db.Decimal(5,2) @map("overall_score")
  summaryFeedbackJson   Json?     @map("summary_feedback_json")

  startedAt             DateTime? @map("started_at")
  completedAt           DateTime? @map("completed_at")
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")

  answers               SimulatorAnswer[]

  @@map("wp_bewerbungstrainer_simulator_sessions")
}

model SimulatorAnswer {
  id                   Int       @id @default(autoincrement())
  sessionId            Int       @map("session_id")
  session              SimulatorSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  questionIndex        Int       @map("question_index")
  questionText         String    @db.Text @map("question_text")
  questionCategory     String?   @db.VarChar(100) @map("question_category")

  audioFilename        String?   @db.VarChar(255) @map("audio_filename")
  audioUrl             String?   @db.Text @map("audio_url")
  audioDurationSeconds Int?      @map("audio_duration_seconds")

  transcript           String?   @db.LongText
  feedbackJson         Json?     @map("feedback_json")
  audioAnalysisJson    Json?     @map("audio_analysis_json")

  contentScore         Decimal?  @db.Decimal(3,1) @map("content_score")
  deliveryScore        Decimal?  @db.Decimal(3,1) @map("delivery_score")
  overallScore         Decimal?  @db.Decimal(3,1) @map("overall_score")

  attemptNumber        Int       @default(1) @map("attempt_number")
  isFinalAttempt       Boolean   @default(true) @map("is_final_attempt")

  createdAt            DateTime  @default(now()) @map("created_at")
  updatedAt            DateTime  @updatedAt @map("updated_at")

  @@map("wp_bewerbungstrainer_simulator_answers")
}

enum Difficulty {
  beginner
  intermediate
  advanced
}

enum SessionStatus {
  setup
  in_progress
  completed
  abandoned
}
```

---

## 4. API Endpoints

### 4.1 Scenario Endpoints

#### `GET /bewerbungstrainer/v1/simulator/scenarios`

Lists all active scenario templates.

**Response:**
```json
{
  "success": true,
  "data": {
    "scenarios": [
      {
        "id": 1,
        "title": "Bewerbungsgespräch",
        "description": "Übe typische Fragen aus einem Vorstellungsgespräch",
        "icon": "briefcase",
        "difficulty": "intermediate",
        "category": "interview",
        "question_count_min": 8,
        "question_count_max": 12,
        "time_limit_per_question": 120,
        "allow_retry": true
      }
    ]
  }
}
```

#### `GET /bewerbungstrainer/v1/simulator/scenarios/{id}`

Gets full scenario details including input configuration.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Bewerbungsgespräch",
    "description": "Übe typische Fragen aus einem Vorstellungsgespräch",
    "icon": "briefcase",
    "difficulty": "intermediate",
    "category": "interview",
    "system_prompt": "Du bist ein erfahrener HR-Manager...",
    "input_configuration": [
      {
        "key": "position",
        "label": "Zielposition",
        "type": "text",
        "required": true,
        "placeholder": "z.B. Product Manager",
        "validation": { "minLength": 2, "maxLength": 100 }
      },
      {
        "key": "company",
        "label": "Unternehmen",
        "type": "text",
        "required": false,
        "placeholder": "z.B. BMW"
      },
      {
        "key": "experience_level",
        "label": "Erfahrungslevel",
        "type": "select",
        "required": true,
        "default": "professional",
        "options": [
          { "value": "student", "label": "Student/Praktikant" },
          { "value": "entry", "label": "Berufseinsteiger" },
          { "value": "professional", "label": "Professional (3-5 Jahre)" },
          { "value": "senior", "label": "Senior (5+ Jahre)" }
        ]
      }
    ],
    "question_count_min": 8,
    "question_count_max": 12,
    "time_limit_per_question": 120,
    "allow_retry": true
  }
}
```

### 4.2 Session Endpoints

#### `POST /bewerbungstrainer/v1/simulator/sessions`

Creates a new training session.

**Request:**
```json
{
  "scenario_id": 1,
  "user_name": "Max Mustermann",
  "variables": {
    "position": "Product Manager",
    "company": "BMW",
    "experience_level": "professional"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "scenario_id": 1,
    "status": "setup"
  }
}
```

#### `POST /bewerbungstrainer/v1/simulator/sessions/{id}/questions`

Generates questions for the session using Gemini.

**Response:**
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "index": 0,
        "question": "Erzählen Sie mir von sich und Ihrem beruflichen Werdegang.",
        "category": "Einstieg",
        "estimated_answer_time": 120
      },
      {
        "index": 1,
        "question": "Was hat Sie dazu bewogen, sich bei BMW zu bewerben?",
        "category": "Motivation",
        "estimated_answer_time": 90
      }
      // ... 8-12 questions total
    ],
    "total_questions": 10
  }
}
```

#### `POST /bewerbungstrainer/v1/simulator/sessions/{id}/answer`

Submits an audio answer and receives immediate feedback.

**Request:** `multipart/form-data`
- `audio`: Audio file (Blob, webm/mp3/wav)
- `question_index`: Current question index (int)
- `question_text`: The question being answered (string)

**Response:**
```json
{
  "success": true,
  "data": {
    "answer_id": 123,
    "transcript": "Also, mein Name ist Max Mustermann und ich arbeite seit drei Jahren als Product Manager...",
    "feedback": {
      "summary": "Deine Antwort war gut strukturiert mit einem klaren Einstieg.",
      "strengths": [
        "Klare chronologische Struktur",
        "Relevante Berufserfahrung genannt",
        "Selbstbewusste Präsentation"
      ],
      "improvements": [
        "Mehr konkrete Zahlen und Erfolge nennen",
        "Den Bezug zur Zielposition stärker hervorheben"
      ],
      "tips": [
        "Bereite 2-3 messbare Erfolge vor, die du nennen kannst",
        "Nutze die STAR-Methode für Beispiele"
      ],
      "scores": {
        "content": 7.5,
        "structure": 8.0,
        "relevance": 7.0,
        "overall": 7.5
      }
    },
    "audio_analysis": {
      "speech_rate": "optimal",
      "filler_words": {
        "count": 2,
        "words": ["ähm", "also"]
      },
      "confidence_score": 75,
      "clarity_score": 80
    }
  }
}
```

#### `PUT /bewerbungstrainer/v1/simulator/sessions/{id}`

Updates session status or progress.

**Request:**
```json
{
  "status": "completed",
  "current_question_index": 10,
  "completed_questions": 10
}
```

#### `GET /bewerbungstrainer/v1/simulator/sessions`

Gets user's session history.

**Response:**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": 42,
        "session_id": "550e8400-e29b-41d4-a716-446655440000",
        "scenario_title": "Bewerbungsgespräch",
        "status": "completed",
        "total_questions": 10,
        "completed_questions": 10,
        "overall_score": 7.8,
        "created_at": "2025-12-07T10:30:00Z",
        "completed_at": "2025-12-07T11:15:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 5,
      "total_pages": 1
    }
  }
}
```

---

## 5. Gemini Integration Pipeline

### 5.1 Question Generation Pipeline

#### Pseudocode

```javascript
/**
 * Generate interview questions using Gemini 1.5 Flash
 *
 * @param {Object} scenario - Scenario template from database
 * @param {Object} variables - User-provided variables from wizard
 * @returns {Array} Array of question objects
 */
async function generateQuestions(scenario, variables) {
  // 1. Build the prompt by interpolating variables into system prompt
  const interpolatedSystemPrompt = interpolateVariables(
    scenario.system_prompt,
    variables
  );

  // 2. Construct the question generation prompt
  const questionPrompt = buildQuestionGenerationPrompt({
    systemPrompt: interpolatedSystemPrompt,
    customPrompt: scenario.question_generation_prompt,
    variables: variables,
    questionCount: {
      min: scenario.question_count_min,
      max: scenario.question_count_max
    }
  });

  // 3. Call Gemini with model fallback
  const response = await callGeminiWithFallback({
    apiKey: getGeminiApiKey(),
    content: questionPrompt,
    context: 'QUESTION_GENERATION'
  });

  // 4. Parse JSON response
  const questions = parseQuestionsFromResponse(response);

  // 5. Validate question structure
  validateQuestions(questions, scenario);

  return questions;
}

/**
 * Build the question generation prompt
 */
function buildQuestionGenerationPrompt({ systemPrompt, customPrompt, variables, questionCount }) {
  const basePrompt = customPrompt || DEFAULT_QUESTION_GENERATION_PROMPT;

  return `${systemPrompt}

${basePrompt}

Kontext:
- Position: ${variables.position}
- Unternehmen: ${variables.company || 'Nicht angegeben'}
- Erfahrungslevel: ${variables.experience_level}

Generiere ${questionCount.min} bis ${questionCount.max} Interviewfragen.

WICHTIG: Antworte NUR mit einem JSON-Array im folgenden Format:
[
  {
    "index": 0,
    "question": "Die Interviewfrage",
    "category": "Kategorie (z.B. Einstieg, Motivation, Fachlich, Soft Skills)",
    "estimated_answer_time": 90
  }
]

JSON Output:`;
}

/**
 * Default question generation prompt (used if scenario doesn't specify one)
 */
const DEFAULT_QUESTION_GENERATION_PROMPT = `
Du bist ein erfahrener HR-Manager und Interviewcoach.
Generiere realistische Interviewfragen, die in einem echten Bewerbungsgespräch gestellt werden könnten.

Beachte:
1. Beginne mit einer Einstiegsfrage ("Erzählen Sie von sich")
2. Mische verschiedene Fragetypen: Motivation, Fachlich, Soft Skills, Situativ
3. Passe die Schwierigkeit an das Erfahrungslevel an
4. Beziehe das Unternehmen ein, wenn angegeben
5. Ende mit einer Frage nach offenen Punkten des Bewerbers
`;
```

### 5.2 Audio Answer Analysis Pipeline (Multimodal)

#### Pseudocode

```javascript
/**
 * Analyze audio answer using Gemini 1.5 Flash Multimodal
 *
 * This is the CORE PIPELINE that:
 * 1. Takes the audio blob
 * 2. Sends it to Gemini along with the question context
 * 3. Receives transcript + feedback in ONE API call
 *
 * @param {Blob} audioBlob - The recorded audio answer
 * @param {string} questionText - The question being answered
 * @param {Object} scenario - Scenario context for feedback customization
 * @param {Object} variables - Session variables for context
 * @returns {Object} { transcript, feedback, audioAnalysis }
 */
async function analyzeAudioAnswer(audioBlob, questionText, scenario, variables) {
  // 1. Convert audio blob to base64 for Gemini
  const audioBase64 = await convertAudioToBase64(audioBlob);

  // 2. Build the multimodal prompt
  const analysisPrompt = buildAudioAnalysisPrompt({
    questionText,
    scenario,
    variables,
    customFeedbackPrompt: scenario.feedback_prompt
  });

  // 3. Construct multimodal content array
  const content = [
    // Text part: Instructions + Question context
    { text: analysisPrompt },
    // Audio part: The recorded answer
    {
      inlineData: {
        mimeType: audioBlob.type || 'audio/webm',
        data: audioBase64
      }
    }
  ];

  // 4. Call Gemini 1.5 Flash (multimodal capable)
  const response = await callGeminiWithFallback({
    apiKey: getGeminiApiKey(),
    content: content,
    context: 'AUDIO_ANALYSIS'
  });

  // 5. Parse the structured JSON response
  const result = parseAudioAnalysisResponse(response);

  // 6. Validate and return
  return {
    transcript: result.transcript,
    feedback: result.feedback,
    audioAnalysis: result.audio_metrics
  };
}

/**
 * Build the audio analysis prompt for multimodal request
 */
function buildAudioAnalysisPrompt({ questionText, scenario, variables, customFeedbackPrompt }) {
  const basePrompt = customFeedbackPrompt || DEFAULT_FEEDBACK_PROMPT;

  return `Du bist ein professioneller Karriere-Coach und analysierst Audioantworten von Bewerbern.

AUFGABE:
1. TRANSKRIBIERE die Audioantwort vollständig
2. ANALYSIERE die Antwort inhaltlich bezüglich der gestellten Frage
3. ANALYSIERE die Sprechweise (Füllwörter, Tempo, Klarheit)
4. GEBE konstruktives Feedback

KONTEXT:
- Szenario: ${scenario.title}
- Position: ${variables.position}
- Unternehmen: ${variables.company || 'Nicht angegeben'}
- Erfahrungslevel: ${variables.experience_level}

FRAGE DIE BEANTWORTET WURDE:
"${questionText}"

${basePrompt}

WICHTIG: Antworte NUR mit einem JSON-Objekt im folgenden Format:

{
  "transcript": "Vollständige Transkription der Audioantwort...",
  "feedback": {
    "summary": "Kurze Zusammenfassung der Antwortqualität (1-2 Sätze)",
    "strengths": [
      "Stärke 1: Konkrete positive Beobachtung",
      "Stärke 2: Was gut gemacht wurde"
    ],
    "improvements": [
      "Verbesserung 1: Was besser gemacht werden könnte",
      "Verbesserung 2: Konkreter Verbesserungsvorschlag"
    ],
    "tips": [
      "Tipp 1: Konkreter, umsetzbarer Ratschlag",
      "Tipp 2: Praktische Empfehlung"
    ],
    "scores": {
      "content": 7.5,
      "structure": 8.0,
      "relevance": 7.0,
      "overall": 7.5
    }
  },
  "audio_metrics": {
    "speech_rate": "optimal | zu_schnell | zu_langsam",
    "filler_words": {
      "count": 3,
      "words": ["ähm", "also", "halt"],
      "severity": "niedrig | mittel | hoch"
    },
    "confidence_score": 75,
    "clarity_score": 80,
    "notes": "Optionale zusätzliche Beobachtungen zur Sprechweise"
  }
}

Bewertungsskala für Scores: 1-10 (1=sehr schwach, 10=exzellent)

AUDIO ZUR ANALYSE:`;
}

/**
 * Default feedback prompt template
 */
const DEFAULT_FEEDBACK_PROMPT = `
Bewerte die Antwort nach folgenden Kriterien:

INHALT (content):
- Vollständigkeit der Antwort
- Relevanz zur Frage
- Konkrete Beispiele und Belege
- Struktur und Logik

PRÄSENTATION (delivery):
- Klarheit der Ausdrucksweise
- Professionalität
- Selbstbewusstsein

Sei konstruktiv, ehrlich und motivierend.
Fokussiere auf umsetzbare Verbesserungen.
Verwende die "Du"-Form.
`;

/**
 * Convert audio blob to base64 string
 */
async function convertAudioToBase64(audioBlob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read audio file'));
    reader.readAsDataURL(audioBlob);
  });
}

/**
 * Parse and validate the Gemini response
 */
function parseAudioAnalysisResponse(responseText) {
  // Extract JSON from potential markdown code blocks
  let jsonString = responseText;

  // Handle ```json ... ``` wrapper
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonString = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonString);

    // Validate required fields
    if (!parsed.transcript) {
      throw new Error('Missing transcript in response');
    }
    if (!parsed.feedback) {
      throw new Error('Missing feedback in response');
    }

    return parsed;
  } catch (error) {
    console.error('Failed to parse Gemini response:', error);
    throw new Error('Invalid response format from AI');
  }
}
```

### 5.3 Model Fallback Strategy

```javascript
/**
 * Gemini model fallback order
 * 1.5 Flash is preferred for low latency
 */
const GEMINI_MODELS = {
  FALLBACK_ORDER: [
    'gemini-2.0-flash-exp',      // Latest experimental
    'gemini-2.0-flash',          // Latest stable
    'gemini-1.5-flash-latest',   // Preferred for speed
    'gemini-1.5-pro-latest',     // Fallback for quality
  ]
};

/**
 * Call Gemini with automatic model fallback
 */
async function callGeminiWithFallback({ apiKey, content, context }) {
  const logPrefix = `[GEMINI ${context}]`;

  let lastError = null;

  for (const modelName of GEMINI_MODELS.FALLBACK_ORDER) {
    try {
      console.log(`🔄 ${logPrefix} Trying model: ${modelName}`);

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent(content);
      const response = await result.response;
      const text = response.text();

      console.log(`✅ ${logPrefix} Success with ${modelName}`);
      return text;

    } catch (error) {
      console.error(`❌ ${logPrefix} Error with ${modelName}:`, error.message);
      lastError = error;

      // Only try next model for 404 errors
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        continue;
      }

      // For other errors, stop trying
      break;
    }
  }

  throw new Error(`${context} failed: ${lastError?.message || 'Unknown error'}`);
}
```

---

## 6. Frontend Components

### 6.1 Component Hierarchy

```
SimulatorApp.jsx
├── SimulatorDashboard.jsx      # Scenario selection grid
│   └── ScenarioCard.jsx        # Individual scenario card
├── SimulatorWizard.jsx         # Dynamic variable input wizard
│   └── DynamicFormField.jsx    # Renders fields from input_configuration
├── SimulatorSession.jsx        # Main session interface
│   ├── QuestionDisplay.jsx     # Shows current question
│   ├── AudioRecorder.jsx       # Recording interface
│   ├── ImmediateFeedback.jsx   # Shows feedback after each answer
│   │   ├── TranscriptDisplay.jsx
│   │   ├── FeedbackScores.jsx
│   │   └── AudioMetrics.jsx
│   └── SessionProgress.jsx     # Progress indicator
├── SimulatorHistory.jsx        # Past sessions list
│   └── SessionSummaryCard.jsx  # Session overview
└── SimulatorSessionDetail.jsx  # Detailed view of past session
    └── AnswerReview.jsx        # Review individual answers
```

### 6.2 Key Component: SimulatorSession

```jsx
// Simplified structure - actual implementation will be more detailed

function SimulatorSession({ session, questions, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleStopRecording = async (audioBlob) => {
    setIsRecording(false);

    // Submit audio and get immediate feedback
    const response = await submitAnswer({
      sessionId: session.id,
      questionIndex: currentIndex,
      questionText: currentQuestion.question,
      audio: audioBlob
    });

    setFeedback(response.data);
    setShowFeedback(true);
  };

  const handleRetry = () => {
    setFeedback(null);
    setShowFeedback(false);
    // Reset recorder for retry
  };

  const handleNext = () => {
    setFeedback(null);
    setShowFeedback(false);

    if (isLastQuestion) {
      onComplete();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  return (
    <div className="simulator-session">
      <SessionProgress
        current={currentIndex + 1}
        total={questions.length}
      />

      <QuestionDisplay
        question={currentQuestion}
        questionNumber={currentIndex + 1}
      />

      {!showFeedback ? (
        <AudioRecorder
          isRecording={isRecording}
          onStart={() => setIsRecording(true)}
          onStop={handleStopRecording}
          timeLimit={session.time_limit_per_question}
        />
      ) : (
        <ImmediateFeedback
          transcript={feedback.transcript}
          feedback={feedback.feedback}
          audioMetrics={feedback.audio_analysis}
          onRetry={handleRetry}
          onNext={handleNext}
          isLastQuestion={isLastQuestion}
          allowRetry={session.allow_retry}
        />
      )}
    </div>
  );
}
```

---

## 7. User Flow

### 7.1 Complete User Journey

```
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 1: SCENARIO SELECTION                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ 💼           │  │ 💰           │  │ 📊           │             │
│  │ Bewerbungs-  │  │ Gehaltsver-  │  │ Projekt-     │             │
│  │ gespräch     │  │ handlung     │  │ präsentation │             │
│  │              │  │              │  │              │             │
│  │ Intermediate │  │ Advanced     │  │ Beginner     │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                     │
│  User clicks on "Bewerbungsgespräch"                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 2: VARIABLE INPUT WIZARD                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ╔═══════════════════════════════════════════════════════════════╗ │
│  ║  Bewerbungsgespräch                                            ║ │
│  ╠═══════════════════════════════════════════════════════════════╣ │
│  ║                                                                 ║ │
│  ║  Zielposition *        ┌─────────────────────────────────────┐ ║ │
│  ║                        │ Product Manager                     │ ║ │
│  ║                        └─────────────────────────────────────┘ ║ │
│  ║                                                                 ║ │
│  ║  Unternehmen           ┌─────────────────────────────────────┐ ║ │
│  ║                        │ BMW                                 │ ║ │
│  ║                        └─────────────────────────────────────┘ ║ │
│  ║                                                                 ║ │
│  ║  Erfahrungslevel *     ┌─────────────────────────────────────┐ ║ │
│  ║                        │ Professional (3-5 Jahre)        ▼  │ ║ │
│  ║                        └─────────────────────────────────────┘ ║ │
│  ║                                                                 ║ │
│  ║  ┌─────────────┐  ┌────────────────────────────────┐          ║ │
│  ║  │  Abbrechen  │  │  🚀 Training starten           │          ║ │
│  ║  └─────────────┘  └────────────────────────────────┘          ║ │
│  ╚═══════════════════════════════════════════════════════════════╝ │
│                                                                     │
│  User fills form and clicks "Training starten"                     │
│  → Questions are generated via Gemini                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 3: QUESTION-BY-QUESTION SESSION                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Frage 1 von 10                    ████████░░░░░░░░░ 10%    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ╔═══════════════════════════════════════════════════════════════╗ │
│  ║                                                                 ║ │
│  ║  "Erzählen Sie mir von sich und Ihrem                          ║ │
│  ║   beruflichen Werdegang."                                      ║ │
│  ║                                                                 ║ │
│  ║                        💬 Einstieg                              ║ │
│  ╚═══════════════════════════════════════════════════════════════╝ │
│                                                                     │
│                     ┌───────────────────┐                          │
│                     │                   │                          │
│                     │    🎤 ●●●●●●●     │  ← Recording animation   │
│                     │                   │                          │
│                     │   01:23 / 02:00   │  ← Time remaining        │
│                     │                   │                          │
│                     └───────────────────┘                          │
│                                                                     │
│                    ┌──────────────────────┐                        │
│                    │  ⏹️  Aufnahme stoppen │                        │
│                    └──────────────────────┘                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ User stops recording
                              │ → Audio sent to Gemini
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 4: IMMEDIATE FEEDBACK                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ╔═══════════════════════════════════════════════════════════════╗ │
│  ║  📝 Deine Antwort (Transkript)                                 ║ │
│  ╠═══════════════════════════════════════════════════════════════╣ │
│  ║  "Also, mein Name ist Max Mustermann und ich arbeite seit      ║ │
│  ║   drei Jahren als Product Manager bei einem mittelständischen  ║ │
│  ║   Unternehmen. Davor habe ich Wirtschaftsinformatik studiert   ║ │
│  ║   und ein Praktikum bei einem Startup gemacht..."              ║ │
│  ╚═══════════════════════════════════════════════════════════════╝ │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │  🎯 BEWERTUNG          Inhalt: 7.5  Struktur: 8.0  Gesamt: 7.5 ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ✅ STÄRKEN                                                        │
│  • Klare chronologische Struktur                                   │
│  • Relevante Berufserfahrung genannt                               │
│  • Selbstbewusste Präsentation                                     │
│                                                                     │
│  📈 VERBESSERUNGEN                                                 │
│  • Mehr konkrete Zahlen und Erfolge nennen                         │
│  • Den Bezug zur Zielposition stärker hervorheben                  │
│                                                                     │
│  💡 TIPPS                                                          │
│  • Bereite 2-3 messbare Erfolge vor                                │
│  • Nutze die STAR-Methode für Beispiele                            │
│                                                                     │
│  🎙️ SPRECHANALYSE                                                  │
│  • Tempo: optimal                                                  │
│  • Füllwörter: 2 ("ähm", "also")                                   │
│  • Klarheit: 80%                                                   │
│                                                                     │
│  ┌─────────────────┐    ┌────────────────────────────┐            │
│  │  🔄 Nochmal     │    │  ➡️ Nächste Frage          │            │
│  └─────────────────┘    └────────────────────────────┘            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ User clicks "Nächste Frage"
                              │ Loop continues for all questions
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 5: SESSION COMPLETE                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ╔═══════════════════════════════════════════════════════════════╗ │
│  ║                     🎉 Training abgeschlossen!                  ║ │
│  ║                                                                 ║ │
│  ║         Gesamtbewertung: ⭐ 7.8 / 10                            ║ │
│  ╚═══════════════════════════════════════════════════════════════╝ │
│                                                                     │
│  📊 ZUSAMMENFASSUNG                                                │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │  10 / 10 Fragen beantwortet                                    ││
│  │  Durchschnitt Inhalt: 7.5                                      ││
│  │  Durchschnitt Struktur: 8.0                                    ││
│  │  Durchschnitt Präsentation: 7.2                                ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │ 📋 Details      │  │ 📄 PDF Export   │  │ 🔄 Nochmal üben │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. Configuration Examples

### 8.1 Input Configuration JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Simulator Input Configuration",
  "type": "array",
  "items": {
    "type": "object",
    "required": ["key", "label", "type"],
    "properties": {
      "key": {
        "type": "string",
        "description": "Unique identifier for the field, used in variable interpolation",
        "pattern": "^[a-z_][a-z0-9_]*$"
      },
      "label": {
        "type": "string",
        "description": "Display label in German"
      },
      "type": {
        "type": "string",
        "enum": ["text", "textarea", "select", "number"],
        "description": "Input field type"
      },
      "required": {
        "type": "boolean",
        "default": false,
        "description": "Whether the field is required"
      },
      "default": {
        "type": "string",
        "description": "Default value for the field"
      },
      "placeholder": {
        "type": "string",
        "description": "Placeholder text"
      },
      "user_input": {
        "type": "boolean",
        "default": true,
        "description": "If false, field is auto-filled and not shown to user"
      },
      "options": {
        "type": "array",
        "description": "Options for select type",
        "items": {
          "type": "object",
          "required": ["value", "label"],
          "properties": {
            "value": { "type": "string" },
            "label": { "type": "string" }
          }
        }
      },
      "validation": {
        "type": "object",
        "properties": {
          "minLength": { "type": "integer" },
          "maxLength": { "type": "integer" },
          "min": { "type": "number" },
          "max": { "type": "number" },
          "pattern": { "type": "string" }
        }
      }
    }
  }
}
```

### 8.2 Example: Bewerbungsgespräch (Job Interview)

```json
{
  "id": 1,
  "title": "Bewerbungsgespräch",
  "description": "Übe typische Fragen aus einem Vorstellungsgespräch und erhalte sofortiges Feedback zu deinen Antworten.",
  "icon": "briefcase",
  "difficulty": "intermediate",
  "category": "interview",

  "system_prompt": "Du bist ein erfahrener HR-Manager mit 15 Jahren Erfahrung in der Personalauswahl. Du führst Bewerbungsgespräche für die Position ${position} ${company ? 'bei ' + company : ''} durch. Der Bewerber hat ein ${experience_level}-Level. Stelle professionelle, aber faire Fragen, die dem Erfahrungslevel angemessen sind.",

  "question_generation_prompt": "Generiere realistische Interviewfragen für ein Bewerbungsgespräch.\n\nRichtlinien:\n1. Beginne mit einer Einstiegsfrage\n2. Mische Fragen zu: Motivation, Fachkompetenz, Soft Skills, Situative Fragen\n3. Passe die Komplexität an ${experience_level} an\n4. ${company ? 'Beziehe ' + company + ' in 2-3 Fragen ein' : ''}\n5. Ende mit einer Frage nach offenen Punkten\n\nJede Frage sollte eine geschätzte Antwortzeit von 60-120 Sekunden haben.",

  "feedback_prompt": "Bewerte die Antwort des Bewerbers für die Position ${position}.\n\nFokussiere auf:\n- Relevanz für die Position\n- STAR-Methode (Situation, Task, Action, Result)\n- Professionalität und Selbstbewusstsein\n- Konkrete Beispiele und Zahlen\n\nSei konstruktiv und motivierend.",

  "input_configuration": [
    {
      "key": "position",
      "label": "Zielposition",
      "type": "text",
      "required": true,
      "placeholder": "z.B. Product Manager, Software Engineer",
      "validation": {
        "minLength": 2,
        "maxLength": 100
      }
    },
    {
      "key": "company",
      "label": "Unternehmen (optional)",
      "type": "text",
      "required": false,
      "placeholder": "z.B. BMW, Siemens, Google"
    },
    {
      "key": "experience_level",
      "label": "Erfahrungslevel",
      "type": "select",
      "required": true,
      "default": "professional",
      "options": [
        { "value": "student", "label": "Student / Praktikant" },
        { "value": "entry", "label": "Berufseinsteiger (0-2 Jahre)" },
        { "value": "professional", "label": "Professional (3-5 Jahre)" },
        { "value": "senior", "label": "Senior / Führungskraft (5+ Jahre)" }
      ]
    },
    {
      "key": "industry",
      "label": "Branche",
      "type": "select",
      "required": false,
      "options": [
        { "value": "tech", "label": "Technologie / IT" },
        { "value": "finance", "label": "Finanzen / Banking" },
        { "value": "consulting", "label": "Beratung" },
        { "value": "manufacturing", "label": "Produktion / Industrie" },
        { "value": "healthcare", "label": "Gesundheitswesen" },
        { "value": "other", "label": "Andere" }
      ]
    }
  ],

  "question_count_min": 8,
  "question_count_max": 12,
  "time_limit_per_question": 120,
  "allow_retry": true
}
```

### 8.3 Example: Gehaltsverhandlung (Salary Negotiation)

```json
{
  "id": 2,
  "title": "Gehaltsverhandlung",
  "description": "Trainiere Argumentationen und Reaktionen für Gehaltsverhandlungen - vom Einstieg bis zur Erhöhung.",
  "icon": "banknote",
  "difficulty": "advanced",
  "category": "negotiation",

  "system_prompt": "Du bist ein erfahrener Personalleiter, der eine Gehaltsverhandlung mit einem Mitarbeiter führt. Die Person arbeitet als ${position} ${company ? 'bei ' + company : ''} und hat ${years_experience} Jahre Erfahrung. Das aktuelle Gehalt liegt bei ${current_salary}. Sei professionell aber auch herausfordernd - teste die Verhandlungsfähigkeiten.",

  "question_generation_prompt": "Generiere realistische Fragen und Situationen für eine Gehaltsverhandlung.\n\nSzenarien sollten beinhalten:\n1. Eröffnung der Verhandlung durch den Mitarbeiter\n2. Fragen nach Begründung für die Gehaltsvorstellung\n3. Einwände und Gegenargumente des Arbeitgebers\n4. Fragen zu alternativen Vergütungen (Benefits, Bonus)\n5. Reaktionen auf 'Nein' oder 'Später'\n\nPasse die Schwierigkeit an ${negotiation_type} an.",

  "feedback_prompt": "Bewerte die Verhandlungsantwort.\n\nKriterien:\n- Selbstbewusstsein ohne Arroganz\n- Konkrete Leistungsnachweise und Marktwert-Argumente\n- Flexibilität und Win-Win-Orientierung\n- Professionelle Reaktion auf Einwände\n\nBerücksichtige: Zielgehalt ${target_salary}, aktuelles Gehalt ${current_salary}.",

  "input_configuration": [
    {
      "key": "negotiation_type",
      "label": "Art der Verhandlung",
      "type": "select",
      "required": true,
      "default": "raise",
      "options": [
        { "value": "new_job", "label": "Neuer Job - Einstiegsgehalt verhandeln" },
        { "value": "raise", "label": "Gehaltserhöhung im aktuellen Job" },
        { "value": "promotion", "label": "Gehaltsverhandlung bei Beförderung" }
      ]
    },
    {
      "key": "position",
      "label": "Aktuelle / Zielposition",
      "type": "text",
      "required": true,
      "placeholder": "z.B. Senior Developer"
    },
    {
      "key": "company",
      "label": "Unternehmen",
      "type": "text",
      "required": false
    },
    {
      "key": "years_experience",
      "label": "Jahre Berufserfahrung",
      "type": "select",
      "required": true,
      "options": [
        { "value": "1-2", "label": "1-2 Jahre" },
        { "value": "3-5", "label": "3-5 Jahre" },
        { "value": "5-10", "label": "5-10 Jahre" },
        { "value": "10+", "label": "Mehr als 10 Jahre" }
      ]
    },
    {
      "key": "current_salary",
      "label": "Aktuelles Jahresgehalt (brutto)",
      "type": "text",
      "required": true,
      "placeholder": "z.B. 55.000 €"
    },
    {
      "key": "target_salary",
      "label": "Zielgehalt (brutto)",
      "type": "text",
      "required": true,
      "placeholder": "z.B. 65.000 €"
    }
  ],

  "question_count_min": 6,
  "question_count_max": 10,
  "time_limit_per_question": 90,
  "allow_retry": true
}
```

### 8.4 Example: Projektpräsentation (Project Presentation)

```json
{
  "id": 3,
  "title": "Projektpräsentation",
  "description": "Übe das Vorstellen von Projekten und das Beantworten von kritischen Rückfragen.",
  "icon": "presentation",
  "difficulty": "intermediate",
  "category": "presentation",

  "system_prompt": "Du bist ein kritisches Publikum bei einer Projektpräsentation. Der Präsentierende stellt das Projekt '${project_name}' vor - ein ${project_type} Projekt mit einem Budget von ${budget} und einer Laufzeit von ${duration}. Stelle anspruchsvolle Rückfragen zu Methodik, Ergebnissen, Risiken und nächsten Schritten.",

  "input_configuration": [
    {
      "key": "project_name",
      "label": "Projektname",
      "type": "text",
      "required": true,
      "placeholder": "z.B. Customer Portal Relaunch"
    },
    {
      "key": "project_type",
      "label": "Projektart",
      "type": "select",
      "required": true,
      "options": [
        { "value": "software", "label": "Software-Entwicklung" },
        { "value": "process", "label": "Prozessoptimierung" },
        { "value": "marketing", "label": "Marketing-Kampagne" },
        { "value": "strategy", "label": "Strategieprojekt" },
        { "value": "research", "label": "Forschung & Entwicklung" }
      ]
    },
    {
      "key": "budget",
      "label": "Projektbudget",
      "type": "text",
      "required": false,
      "placeholder": "z.B. 500.000 €"
    },
    {
      "key": "duration",
      "label": "Projektdauer",
      "type": "text",
      "required": false,
      "placeholder": "z.B. 6 Monate"
    },
    {
      "key": "project_description",
      "label": "Kurze Projektbeschreibung",
      "type": "textarea",
      "required": true,
      "placeholder": "Beschreibe in 2-3 Sätzen, worum es in dem Projekt geht..."
    },
    {
      "key": "audience_type",
      "label": "Zielgruppe der Präsentation",
      "type": "select",
      "required": true,
      "default": "management",
      "options": [
        { "value": "management", "label": "Management / Führungskräfte" },
        { "value": "stakeholders", "label": "Projektstakeholder" },
        { "value": "team", "label": "Team / Kollegen" },
        { "value": "external", "label": "Externe Kunden / Partner" }
      ]
    }
  ],

  "question_count_min": 8,
  "question_count_max": 12,
  "time_limit_per_question": 90,
  "allow_retry": true
}
```

---

## 9. Implementation Roadmap

### Phase 1: Backend Foundation (Week 1-2)

- [ ] Create database tables with migrations
- [ ] Implement `SimulatorScenario` model with CRUD methods
- [ ] Implement `SimulatorSession` model with CRUD methods
- [ ] Implement `SimulatorAnswer` model with CRUD methods
- [ ] Create API endpoints for scenarios
- [ ] Create API endpoints for sessions
- [ ] Add Gemini question generation service
- [ ] Add Gemini audio analysis service (multimodal)

### Phase 2: Frontend Core (Week 2-3)

- [ ] Create `SimulatorDashboard` component (scenario grid)
- [ ] Create `SimulatorWizard` component (dynamic form)
- [ ] Implement `DynamicFormField` from input_configuration
- [ ] Create `SimulatorSession` main component
- [ ] Implement `AudioRecorder` component
- [ ] Implement `QuestionDisplay` component
- [ ] Create `ImmediateFeedback` component

### Phase 3: Integration & Polish (Week 3-4)

- [ ] Integrate frontend with backend APIs
- [ ] Implement session state management
- [ ] Add progress tracking and persistence
- [ ] Create `SimulatorHistory` component
- [ ] Create `SimulatorSessionDetail` component
- [ ] Add PDF export functionality
- [ ] Add error handling and loading states

### Phase 4: Testing & Launch (Week 4)

- [ ] Unit tests for backend services
- [ ] Integration tests for API endpoints
- [ ] E2E tests for complete user flows
- [ ] Performance testing with audio files
- [ ] Create initial scenario templates
- [ ] Documentation and admin guide

---

## Appendix A: Comparison with Existing Features

| Feature | Roleplay | Video Training | **Skill Simulator** |
|---------|----------|----------------|---------------------|
| **Scenario Storage** | WordPress CPT | Hardcoded | **SQL Tables** |
| **AI Engine** | ElevenLabs + Gemini | Gemini | **Gemini 1.5 Flash** |
| **Media** | WebSocket Audio | Video Recording | **Audio Blob** |
| **Feedback Timing** | End of session | End of session | **Per question** |
| **Flow Control** | Continuous | Navigate freely | **Retry/Next** |
| **Transcription** | ElevenLabs | Gemini | **Gemini Multimodal** |
| **Dynamic Config** | variables_schema | Fixed fields | **input_configuration** |

---

## Appendix B: Error Handling

### API Error Responses

```json
{
  "success": false,
  "error": {
    "code": "GEMINI_ERROR",
    "message": "Fehler bei der Audio-Analyse. Bitte versuche es erneut.",
    "details": "Model quota exceeded"
  }
}
```

### Error Codes

| Code | Description | User Action |
|------|-------------|-------------|
| `SCENARIO_NOT_FOUND` | Scenario ID doesn't exist | Select different scenario |
| `SESSION_NOT_FOUND` | Session ID doesn't exist | Start new session |
| `INVALID_AUDIO` | Audio file corrupt/wrong format | Re-record answer |
| `GEMINI_ERROR` | Gemini API failure | Retry submission |
| `GEMINI_QUOTA` | API quota exceeded | Wait and retry |
| `VALIDATION_ERROR` | Missing required fields | Fill required fields |

---

**Document Version History:**

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-07 | Initial specification |

---

*End of Technical Specification*
