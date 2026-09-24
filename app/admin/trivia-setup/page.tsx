"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Plus, CheckCircle, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  getTriviaCategories,
  getTriviaStages,
  getTriviaPrizes,
  createTriviaCategory,
  createTriviaStage,
  createTriviaPrize,
  createTriviaQuestion,
  downloadTriviaQuestionsCsvTemplate,
  bulkUploadTriviaQuestions,
  type TriviaCategory,
  type TriviaStage,
  type TriviaPrize,
  type CreateCategoryRequest,
  type CreateStageRequest,
  type CreatePrizeRequest,
  type CreateQuestionRequest,
} from "@/lib/api/admin";

interface CategoryFormData {
  name: string;
  active: boolean;
}

interface StageFormData {
  name: string;
  sortOrder: number;
  active: boolean;
  difficultyLabel?: string;
}

interface PrizeFormData {
  stageName: string;
  period: "WEEKLY" | "MONTHLY";
  description: string;
}

interface QuestionFormData {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  stageName: string;
  categoryName: string;
}

export default function TriviaSetupPage() {
  const [categories, setCategories] = useState<TriviaCategory[]>([]);
  const [stages, setStages] = useState<TriviaStage[]>([]);
  const [prizes, setPrizes] = useState<TriviaPrize[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prizesError, setPrizesError] = useState<string | null>(null);
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadingCSV, setUploadingCSV] = useState(false);

  const { register: registerCat, handleSubmit: handleSubmitCat, reset: resetCat, formState: { errors: errorsCat } } = useForm<CategoryFormData>();
  const { register: registerStage, handleSubmit: handleSubmitStage, reset: resetStage, formState: { errors: errorsStage } } = useForm<StageFormData>();
  const { register: registerPrize, handleSubmit: handleSubmitPrize, reset: resetPrize, formState: { errors: errorsPrize } } = useForm<PrizeFormData>();
  const { register: registerQuestion, handleSubmit: handleSubmitQuestion, reset: resetQuestion, formState: { errors: errorsQuestion } } = useForm<QuestionFormData>();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        setPrizesError(null);
        
        const [categoriesResult, stagesResult, prizesResult] = await Promise.allSettled([
          getTriviaCategories(),
          getTriviaStages(),
          getTriviaPrizes(),
        ]);
        
        if (categoriesResult.status === "fulfilled") setCategories(categoriesResult.value);
        if (stagesResult.status === "fulfilled") setStages(stagesResult.value);
        if (prizesResult.status === "fulfilled") {
          setPrizes(prizesResult.value);
        } else {
          setPrizesError(prizesResult.reason instanceof Error ? prizesResult.reason.message : "Failed to load prizes");
        }
      } catch (err) {
        console.error("Error loading trivia data:", err);
        setError(err instanceof Error ? err.message : "Failed to load trivia data");
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  const onSubmitCategory = async (data: CategoryFormData) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const payload: CreateCategoryRequest = {
        name: data.name,
        active: data.active,
      };

      const response = await createTriviaCategory(payload);

      setSuccessMessage(response.message || "Category created and submitted for approval");
      setShowCategoryModal(false);
      resetCat();
    } catch (err) {
      console.error("Error saving category:", err);
      setError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitStage = async (data: StageFormData) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const payload: CreateStageRequest = {
        name: data.name,
        sortOrder: data.sortOrder,
        active: data.active,
        difficultyLabel: data.difficultyLabel || undefined,
      };

      const response = await createTriviaStage(payload);

      setSuccessMessage(response.message || "Stage created and submitted for approval");
      setShowStageModal(false);
      resetStage();
    } catch (err) {
      console.error("Error saving stage:", err);
      setError(err instanceof Error ? err.message : "Failed to save stage");
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitPrize = async (data: PrizeFormData) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const payload: CreatePrizeRequest = {
        stageName: data.stageName,
        period: data.period,
        description: data.description,
      };

      const response = await createTriviaPrize(payload);
      setSuccessMessage(response.message || "Prize created and submitted for approval");
      setShowPrizeModal(false);
      resetPrize();
    } catch (err) {
      console.error("Error creating prize:", err);
      setError(err instanceof Error ? err.message : "Failed to create prize");
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitQuestion = async (data: QuestionFormData) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const payload: CreateQuestionRequest = {
        questionText: data.questionText,
        optionA: data.optionA,
        optionB: data.optionB,
        optionC: data.optionC,
        optionD: data.optionD,
        correctOption: data.correctOption,
        stageName: data.stageName,
        categoryName: data.categoryName,
      };

      const response = await createTriviaQuestion(payload);
      setSuccessMessage(response.message || "Question created and submitted for approval");
      setShowQuestionModal(false);
      resetQuestion();
    } catch (err) {
      console.error("Error creating question:", err);
      setError(err instanceof Error ? err.message : "Failed to create question");
    } finally {
      setSubmitting(false);
    }
  };

  const downloadCSVTemplate = async () => {
    try {
      await downloadTriviaQuestionsCsvTemplate();
    } catch (err) {
      console.error("Error downloading CSV template:", err);
      setError(err instanceof Error ? err.message : "Failed to download CSV template");
    }
  };

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith(".csv")) {
      setError("Please select a valid CSV file");
      return;
    }
    
    try {
      setUploadingCSV(true);
      setError(null);
      const response = await bulkUploadTriviaQuestions(file);
      setSuccessMessage(`Bulk upload submitted for approval! Change Request ID: ${response.changeRequestId}`);
      // Reset file input
      event.target.value = "";
    } catch (err) {
      console.error("Error uploading CSV:", err);
      setError(err instanceof Error ? err.message : "Failed to upload CSV file");
    } finally {
      setUploadingCSV(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-extrabold">Trivia Setup</h1>
        <div className="bg-card border border-border rounded-2xl p-12 flex items-center justify-center">
          <div className="text-muted-foreground">Loading trivia configuration...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Trivia Setup</h1>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-600 flex items-start gap-3">
          <CheckCircle size={20} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{successMessage}</p>
            <p className="text-sm mt-1 opacity-80">Changes will take effect after approval by a checker.</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Categories Section */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Trivia Categories</h2>
            <Button 
              variant="outline" 
              onClick={() => {
                resetCat({ name: "", active: true });
                setShowCategoryModal(true);
              }}
              className="gap-2"
            >
              <Plus size={16} />
              Add
            </Button>
          </div>
          
          <div className="space-y-2">
            {categories.length > 0 ? (
              categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
                  <div>
                    <p className="font-medium">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cat.active ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No categories yet</p>
            )}
          </div>
        </div>

        {/* Stages Section */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Trivia Stages</h2>
            <Button 
              variant="outline" 
              onClick={() => {
                resetStage({ name: "", sortOrder: stages.length + 1, active: true, difficultyLabel: "" });
                setShowStageModal(true);
              }}
              className="gap-2"
            >
              <Plus size={16} />
              Add
            </Button>
          </div>
          
          <div className="space-y-2">
            {stages.length > 0 ? (
              stages
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((stage) => (
                  <div key={stage.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
                    <div>
                      <p className="font-medium">{stage.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Order: {stage.sortOrder} • {stage.difficultyLabel || "No label"} • {stage.active ? "Active" : "Inactive"}
                      </p>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No stages yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Prizes Section (Read-only) */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Trivia Prizes</h2>
          <Button 
            variant="outline" 
            onClick={() => {
              resetPrize({ stageName: "", period: "WEEKLY", description: "" });
              setShowPrizeModal(true);
            }}
            className="gap-2"
          >
            <Plus size={16} />
            Add Prize
          </Button>
        </div>
        
        {/* Prizes Error Banner */}
        {prizesError && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-yellow-600 mb-4">
            <p className="font-medium">Note: {prizesError}</p>
            <p className="text-sm mt-1 opacity-80">This is a known server-side issue. You can still create new prizes above.</p>
          </div>
        )}
        
        <div className="space-y-2">
          {prizes.length > 0 ? (
            prizes.map((prize) => (
              <div key={prize.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
                <div>
                  <p className="font-medium">{prize.stageName}</p>
                  <p className="text-sm text-muted-foreground">
                    {prize.prizeType}: {prize.prizeValue?.toLocaleString() ?? "N/A"}
                  </p>
                </div>
              </div>
            ))
          ) : prizesError ? (
            <p className="text-sm text-muted-foreground text-center py-6">Unable to load prizes due to error above</p>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No prizes configured</p>
          )}
        </div>
      </div>

      {/* Questions Section */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Trivia Questions</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadCSVTemplate} className="gap-2">
              <Download size={16} />
              CSV Template
            </Button>
            <label className="cursor-pointer">
              <Button variant="outline" disabled={uploadingCSV} className="gap-2">
                <Plus size={16} />
                {uploadingCSV ? "Uploading..." : "Bulk Upload CSV"}
              </Button>
              <input
                type="file"
                accept=".csv"
                onChange={handleBulkUpload}
                className="hidden"
                disabled={uploadingCSV}
              />
            </label>
            <Button 
              variant="outline" 
              onClick={() => {
                resetQuestion({ 
                  questionText: "", 
                  optionA: "", 
                  optionB: "", 
                  optionC: "", 
                  optionD: "", 
                  correctOption: "A", 
                  stageName: "", 
                  categoryName: "" 
                });
                setShowQuestionModal(true);
              }}
              className="gap-2"
            >
              <Plus size={16} />
              Add Question
            </Button>
          </div>
        </div>
        
        <div className="bg-secondary/20 rounded-xl p-4 text-sm text-muted-foreground text-center">
          <p>Use the form above to add questions individually, or download the CSV template for bulk uploads.</p>
          <p className="mt-1 text-xs">All questions are submitted for maker-checker approval before going live.</p>
        </div>
      </div>

      {/* Category Modal */}
      <Modal
        open={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setError(null);
        }}
        title="Add Category"
      >
        <form onSubmit={handleSubmitCat(onSubmitCategory)} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Category Name</label>
            <Input {...registerCat("name", { required: "Name is required" })} placeholder="Actors & Actresses" />
            {errorsCat.name && <p className="text-destructive text-sm mt-1">{errorsCat.name.message}</p>}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="category-active"
              {...registerCat("active")}
              className="h-4 w-4 rounded border-border"
            />
            <label htmlFor="category-active" className="text-sm font-medium cursor-pointer">
              Active (visible to users)
            </label>
          </div>
          <Button type="submit" variant="gradient" className="w-full justify-center" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit for Approval"}
          </Button>
        </form>
      </Modal>

      {/* Stage Modal */}
      <Modal
        open={showStageModal}
        onClose={() => {
          setShowStageModal(false);
          setError(null);
        }}
        title="Add Stage"
      >
        <form onSubmit={handleSubmitStage(onSubmitStage)} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Stage Name</label>
            <Input {...registerStage("name", { required: "Name is required" })} placeholder="Beginner" />
            {errorsStage.name && <p className="text-destructive text-sm mt-1">{errorsStage.name.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Sort Order</label>
            <Input 
              type="number" 
              {...registerStage("sortOrder", { required: "Order is required", valueAsNumber: true, min: 1 })} 
              placeholder="1"
            />
            {errorsStage.sortOrder && <p className="text-destructive text-sm mt-1">{errorsStage.sortOrder.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Difficulty Label (Optional)</label>
            <Input {...registerStage("difficultyLabel")} placeholder="Easy" />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="stage-active"
              {...registerStage("active")}
              className="h-4 w-4 rounded border-border"
            />
            <label htmlFor="stage-active" className="text-sm font-medium cursor-pointer">
              Active (visible to users)
            </label>
          </div>
          <Button type="submit" variant="gradient" className="w-full justify-center" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit for Approval"}
          </Button>
        </form>
      </Modal>

      {/* Prize Modal */}
      <Modal
        open={showPrizeModal}
        onClose={() => {
          setShowPrizeModal(false);
          setError(null);
        }}
        title="Add Prize"
      >
        <form onSubmit={handleSubmitPrize(onSubmitPrize)} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Stage Name</label>
            <select 
              {...registerPrize("stageName", { required: "Stage is required" })}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl"
            >
              <option value="">Select a stage</option>
              {stages.filter(s => s.active).map(stage => (
                <option key={stage.id} value={stage.name}>{stage.name}</option>
              ))}
            </select>
            {errorsPrize.stageName && <p className="text-destructive text-sm mt-1">{errorsPrize.stageName.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Period</label>
            <select 
              {...registerPrize("period", { required: "Period is required" })}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl"
            >
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
            {errorsPrize.period && <p className="text-destructive text-sm mt-1">{errorsPrize.period.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Description</label>
            <Input {...registerPrize("description", { required: "Description is required" })} placeholder="Top performer prize for this stage" />
            {errorsPrize.description && <p className="text-destructive text-sm mt-1">{errorsPrize.description.message}</p>}
          </div>
          <Button type="submit" variant="gradient" className="w-full justify-center" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit for Approval"}
          </Button>
        </form>
      </Modal>

      {/* Question Modal */}
      <Modal
        open={showQuestionModal}
        onClose={() => {
          setShowQuestionModal(false);
          setError(null);
        }}
        title="Add Question"
      >
        <form onSubmit={handleSubmitQuestion(onSubmitQuestion)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className="text-sm font-medium mb-2 block">Question Text</label>
            <textarea 
              {...registerQuestion("questionText", { required: "Question is required" })}
              placeholder="Who directed The Dark Knight?"
              className="w-full px-3 py-2 bg-background border border-border rounded-xl min-h-[80px]"
            />
            {errorsQuestion.questionText && <p className="text-destructive text-sm mt-1">{errorsQuestion.questionText.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Option A</label>
              <Input {...registerQuestion("optionA", { required: "Required" })} placeholder="First option" />
              {errorsQuestion.optionA && <p className="text-destructive text-sm mt-1">{errorsQuestion.optionA.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Option B</label>
              <Input {...registerQuestion("optionB", { required: "Required" })} placeholder="Second option" />
              {errorsQuestion.optionB && <p className="text-destructive text-sm mt-1">{errorsQuestion.optionB.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Option C</label>
              <Input {...registerQuestion("optionC", { required: "Required" })} placeholder="Third option" />
              {errorsQuestion.optionC && <p className="text-destructive text-sm mt-1">{errorsQuestion.optionC.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Option D</label>
              <Input {...registerQuestion("optionD", { required: "Required" })} placeholder="Fourth option" />
              {errorsQuestion.optionD && <p className="text-destructive text-sm mt-1">{errorsQuestion.optionD.message}</p>}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Correct Option</label>
            <select 
              {...registerQuestion("correctOption", { required: "Correct option is required" })}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl"
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
            {errorsQuestion.correctOption && <p className="text-destructive text-sm mt-1">{errorsQuestion.correctOption.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Stage</label>
            <select 
              {...registerQuestion("stageName", { required: "Stage is required" })}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl"
            >
              <option value="">Select a stage</option>
              {stages.filter(s => s.active).map(stage => (
                <option key={stage.id} value={stage.name}>{stage.name}</option>
              ))}
            </select>
            {errorsQuestion.stageName && <p className="text-destructive text-sm mt-1">{errorsQuestion.stageName.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <select 
              {...registerQuestion("categoryName", { required: "Category is required" })}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl"
            >
              <option value="">Select a category</option>
              {categories.filter(c => c.active).map(category => (
                <option key={category.id} value={category.name}>{category.name}</option>
              ))}
            </select>
            {errorsQuestion.categoryName && <p className="text-destructive text-sm mt-1">{errorsQuestion.categoryName.message}</p>}
          </div>
          <Button type="submit" variant="gradient" className="w-full justify-center" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit for Approval"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
