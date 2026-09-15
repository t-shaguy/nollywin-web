"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Download, Upload as UploadIcon } from "lucide-react";
import Papa from "papaparse";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTriviaQuestionsStore } from "@/store/trivia-questions-store";
import { useTriviaPrizesStore } from "@/store/trivia-prizes-store";

interface QuestionFormData {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  stage: string;
  category: string;
}

interface PrizeFormData {
  stage: string;
  category: string;
  description: string;
}

export default function TriviaSetupPage() {
  const router = useRouter();
  const addQuestion = useTriviaQuestionsStore((s) => s.addQuestion);
  const savePrize = useTriviaPrizesStore((s) => s.savePrize);
  const [questionSuccess, setQuestionSuccess] = useState(false);
  const [prizeSuccess, setPrizeSuccess] = useState(false);
  const [bulkUploadResult, setBulkUploadResult] = useState<string | null>(null);

  const { register: registerQ, handleSubmit: handleSubmitQ, reset: resetQ, formState: { errors: errorsQ } } = useForm<QuestionFormData>();
  const { register: registerP, handleSubmit: handleSubmitP, reset: resetP, formState: { errors: errorsP } } = useForm<PrizeFormData>();

  const onSubmitQuestion = (data: QuestionFormData) => {
    addQuestion({
      question: data.question,
      options: [data.optionA, data.optionB, data.optionC, data.optionD, data.optionE],
      correctIndex: 0, // Option A is marked as correct in the design
      stage: 1, // Default stage
      difficulty: "Easy", // Default difficulty
    });
    resetQ();
    setQuestionSuccess(true);
    setTimeout(() => setQuestionSuccess(false), 3000);
  };

  const onSubmitPrize = (data: PrizeFormData) => {
    savePrize(data);
    resetP();
    setPrizeSuccess(true);
    setTimeout(() => setPrizeSuccess(false), 3000);
  };

  const downloadTemplate = () => {
    const csv = "question,optionA,optionB,optionC,optionD,optionE,correctOption,stage,category\n" +
                '"Sample question?","Option A","Option B","Option C","Option D","Option E",A,"Stage 1","Actors & Actresses"';
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trivia-questions-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<Record<string, string>>(file, {
      header: true,
      complete: (results) => {
        let count = 0;
        results.data.forEach((row) => {
          if (!row.question || !row.optionA) return; // Skip empty rows
          const correctOptionLetter = row.correctOption?.toUpperCase() || "A";
          const correctIndex = correctOptionLetter === "A" ? 0 
            : correctOptionLetter === "B" ? 1 
            : correctOptionLetter === "C" ? 2 
            : correctOptionLetter === "D" ? 3 
            : 4; // E
          
          addQuestion({
            question: row.question,
            options: [row.optionA, row.optionB, row.optionC, row.optionD, row.optionE],
            correctIndex,
            stage: 1, // Default stage
            difficulty: "Easy", // Default difficulty
          });
          count++;
        });
        setBulkUploadResult(`${count} questions added successfully!`);
        setTimeout(() => setBulkUploadResult(null), 5000);
      },
    });
    e.target.value = ""; // Reset input
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Trivia Setup</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={downloadTemplate} className="gap-2">
            <Download size={18} />
            Download CSV Template
          </Button>
          <label className="cursor-pointer">
            <Button variant="gradient" className="gap-2">
              <UploadIcon size={18} />
              Bulk Upload
            </Button>
            <input
              type="file"
              accept=".csv"
              onChange={handleBulkUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {bulkUploadResult && (
        <div className="bg-primary/10 border border-primary text-primary rounded-xl p-4 text-sm font-medium">
          {bulkUploadResult}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Add Single Question */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6">Add Single Question</h2>
          <form onSubmit={handleSubmitQ(onSubmitQuestion)} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Question Text</label>
              <textarea
                {...registerQ("question", { required: "Question is required" })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-input text-foreground resize-none"
                rows={3}
                placeholder="Enter your trivia question"
              />
              {errorsQ.question && <p className="text-destructive text-sm mt-1">{errorsQ.question.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Option A (Correct)</label>
                <Input
                  {...registerQ("optionA", { required: "Required" })}
                  placeholder="Correct answer"
                  className="border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Option B</label>
                <Input {...registerQ("optionB", { required: "Required" })} placeholder="Option B" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Option C</label>
                <Input {...registerQ("optionC", { required: "Required" })} placeholder="Option C" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Option D</label>
                <Input {...registerQ("optionD", { required: "Required" })} placeholder="Option D" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Option E</label>
                <Input {...registerQ("optionE", { required: "Required" })} placeholder="Option E" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Difficulty Stage</label>
                <select
                  {...registerQ("stage", { required: "Required" })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-input text-foreground"
                >
                  <option value="">Select stage</option>
                  <option value="Stage 1">Stage 1 (Beginner)</option>
                  <option value="Stage 2">Stage 2 (Intermediate)</option>
                  <option value="Stage 3">Stage 3 (Advanced)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <select
                  {...registerQ("category", { required: "Required" })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-input text-foreground"
                >
                  <option value="">Select category</option>
                  <option value="Actors & Actresses">Actors & Actresses</option>
                  <option value="Movies">Movies</option>
                  <option value="Directors">Directors</option>
                  <option value="History">History</option>
                </select>
              </div>
            </div>

            {questionSuccess && (
              <div className="bg-primary/10 border border-primary text-primary rounded-xl p-3 text-sm font-medium text-center">
                Question saved successfully!
              </div>
            )}

            <Button type="submit" variant="gradient" className="w-full justify-center">
              Save Question
            </Button>
          </form>
        </div>

        {/* Setup Trivia Prizes */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6">Setup Trivia Prizes</h2>
          <form onSubmit={handleSubmitP(onSubmitPrize)} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Target Stage</label>
              <select
                {...registerP("stage", { required: "Required" })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-input text-foreground"
              >
                <option value="">Select stage</option>
                <option value="Stage 1">Stage 1 (Beginner)</option>
                <option value="Stage 2">Stage 2 (Intermediate)</option>
                <option value="Stage 3">Stage 3 (Advanced)</option>
              </select>
              {errorsP.stage && <p className="text-destructive text-sm mt-1">{errorsP.stage.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <select
                {...registerP("category", { required: "Required" })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-input text-foreground"
              >
                <option value="">Select category</option>
                <option value="Actors & Actresses">Actors & Actresses</option>
                <option value="Movies">Movies</option>
                <option value="Directors">Directors</option>
                <option value="History">History</option>
              </select>
              {errorsP.category && <p className="text-destructive text-sm mt-1">{errorsP.category.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Prize Description</label>
              <Input
                {...registerP("description", { required: "Required" })}
                placeholder="₦50,000"
              />
              {errorsP.description && <p className="text-destructive text-sm mt-1">{errorsP.description.message}</p>}
            </div>

            {prizeSuccess && (
              <div className="bg-primary/10 border border-primary text-primary rounded-xl p-3 text-sm font-medium text-center">
                Prize setup saved successfully!
              </div>
            )}

            <Button type="submit" variant="gradient" className="w-full justify-center">
              Save Prize Setup
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border">
            <h3 className="font-semibold mb-2">Trivia Reports</h3>
            <p className="text-sm text-muted-foreground mb-4">
              View comprehensive analytics and reports for trivia gameplay
            </p>
            <Button variant="outline" onClick={() => router.push("/admin/reports")} className="w-full justify-center">
              View Detailed Reports
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
