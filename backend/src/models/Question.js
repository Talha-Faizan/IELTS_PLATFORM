const mongoose = require("mongoose");

const questionItemSchema = new mongoose.Schema(
  {
    questionNumber: { type: Number, required: true },
    questionText: { type: String, required: true },
    options: [{ type: String }],
    correctAnswer: { type: mongoose.Schema.Types.Mixed },
    explanation: { type: String, default: null },
    part: { type: String }, // For Speaking (Part 1, 2, 3)
    sampleAnswer: { type: String, default: null },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    section: {
      type: String,
      enum: ["reading", "listening", "writing", "speaking"],
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      // reading: multiple_choice | match_headings | match_information | fill_blank | true_false_ng | yes_no_ng
      // listening: mcq | fill_blank | matching | map_label
      // writing: task1 | task2
      // speaking: parts
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    contentBlockId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContentBlock",
      default: null,
    },
    content: {

      // Writing
      prompt: { type: String, default: null },
      taskType: { type: String, enum: ["task1", "task2", null], default: null },
      imageUrl: { type: String, default: null }, // Task 1 chart/graph image
      minimumWords: { type: Number, default: null },

      // Speaking
      cueCard: {
        topic: { type: String },
        bulletPoints: [{ type: String }],
        preparationTime: { type: Number, default: 60 }, // seconds
        speakingTime: { type: Number, default: 120 }, // seconds
      },

      // Shared: questions array used by reading, listening, speaking
      questions: [questionItemSchema],
    },
    tags: [{ type: String, lowercase: true, trim: true }],
    isPublished: { type: Boolean, default: false, index: true },
    timeLimit: { type: Number, default: null }, // minutes
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Compound indexes for efficient content serving
questionSchema.index({ section: 1, isPublished: 1, difficulty: 1 });
questionSchema.index({ section: 1, isPublished: 1, type: 1 });
questionSchema.index({ tags: 1 });

module.exports = mongoose.model("Question", questionSchema);
