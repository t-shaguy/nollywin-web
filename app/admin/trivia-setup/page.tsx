"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Plus, CheckCircle, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminCard } from "@/components/admin/admin-card";
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
      <div className="space-y-4 sm:space-y-5">
        <AdminPageHeader title="Trivia Setup" />
        <AdminCard>
          <div className="py-8 flex items-center justify-center">
            <div className="text-muted-foreground text-xs">Loading trivia configuration...</div>
          </div>
        </AdminCard>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <AdminPageHeader title="Trivia Setup" />

      {/* Success Message */}
      {successMessage && (
        <div className="bg-muted/50 border border-border rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
          <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] shrink-0 mt-0.5 text-muted-foreground" />
          <div>
            <p className="text-xs sm:text-sm text-foreground">{successMessage}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Changes will take effect after approval by a checker.</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 sm:p-4 text-destructive text-xs sm:text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Categories Section */}
        <AdminCard
          title="Trivia Categories"
          action={
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                resetCat({ name: "", active: true });
                setShowCategoryModal(true);
              }}
              className="gap-1.5 text-xs h-8 px-2.5"
            >
              <Plus size={14} />
              <span>Add</span>
            </Button>
          }
        >
          <div className="space-y-2">
            {categories.length > 0 ? (
              categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-2.5 bg-secondary/30 rounded-lg">
                  <div>
                    <p className="font-medium text-xs">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cat.active ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No categories yet</p>
            )}
          </div>
        </AdminCard>

        {/* Stages Section */}
        <AdminCard
          title="Trivia Stages"
          action={
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                resetStage({ name: "", sortOrder: stages.length + 1, active: true, difficultyLabel: "" });
                setShowStageModal(true);
              }}
              className="gap-1.5 text-xs h-8 px-2.5"
            >
              <Plus size={14} />
              <span>Add</span>
            </Button>
          }
        >
          <div className="space-y-2">
            {stages.length > 0 ? (
              stages
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((stage) => (
                  <div key={stage.id} className="flex items-center justify-between p-2.5 bg-secondary/30 rounded-lg">
                    <div>
                      <p className="font-medium text-xs">{stage.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Order: {stage.sortOrder} • {stage.difficultyLabel || "No label"} • {stage.active ? "Active" : "Inactive"}
                      </p>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No stages yet</p>
            )}
          </div>
        </AdminCard>
      </div>

      {/* Prizes Section (Read-only) */}
      <AdminCard
        title="Trivia Prizes"
        action={
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              resetPrize({ stageName: "", period: "WEEKLY", description: "" });
              setShowPrizeModal(true);
            }}
            className="gap-1.5 text-xs h-8 px-2.5"
          >
            <Plus size={14} />
            <span>Add Prize</span>
          </Button>
        }
      >
        {/* Prizes Error Banner */}
        {prizesError && (
          <div className="bg-muted/50 border border-border rounded-xl p-3 mb-3 text-xs">
            <p className="font-medium text-muted-foreground">Note: {prizesError}</p>
            <p className="text-muted-foreground mt-0.5">This is a known server-side issue. You can still create new prizes above.</p>
          </div>
        )}
        
        <div className="space-y-2">
          {prizes.length > 0 ? (
            prizes.map((prize) => (
              <div key={prize.id} className="flex items-center justify-between p-2.5 bg-secondary/30 rounded-lg">
                <div>
                  <p className="font-medium text-xs">{prize.stageName}</p>
                  <p className="text-xs text-muted-foreground">
                    {prize.period}: {prize.description}
                  </p>
                </div>
              </div>
            ))
          ) : prizesError ? (
            <p className="text-xs text-muted-foreground text-center py-4">Unable to load prizes due to error above</p>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">No prizes configured</p>
          )}
        </div>
      </AdminCard>

      {/* Questions Section */}
      <AdminCard title="Trivia Questions">
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={downloadCSVTemplate} className="gap-1.5 text-xs h-8 px-2.5">
            <Download size={14} />
            CSV Template
          </Button>
          <label className="cursor-pointer flex-1 sm:flex-initial">
            <Button variant="outline" size="sm" disabled={uploadingCSV} className="gap-1.5 text-xs h-8 px-2.5 w-full">
              <Plus size={14} />
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
            size="sm"
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
            className="gap-1.5 text-xs h-8 px-2.5"
          >
            <Plus size={14} />
            Add Question
          </Button>
        </div>
        
        <div className="bg-secondary/20 rounded-xl p-3 text-xs text-muted-foreground text-center">
          <p>Use the form above to add questions individually, or download the CSV template for bulk uploads.</p>
          <p className="mt-1 text-xs">All questions are submitted for maker-checker approval before going live.</p>
        </div>
      </AdminCard>

      {/* Category Modal */}
      <Modal
        open={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setError(null);
        }}
        title="Add Category"
      >
        <form onSubmit={handleSubmitCat(onSubmitCategory)} className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-1.5 block">Category Name</label>
            <Input {...registerCat("name", { required: "Name is required" })} placeholder="Actors & Actresses" className="h-9 text-sm" />
            {errorsCat.name && <p className="text-destructive text-xs mt-1">{errorsCat.name.message}</p>}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="category-active"
              {...registerCat("active")}
              className="h-3.5 w-3.5 rounded border-border"
            />
            <label htmlFor="category-active" className="text-xs font-medium cursor-pointer">
              Active (visible to users)
            </label>
          </div>
          <Button type="submit" variant="gradient" className="w-full justify-center h-9 text-sm" disabled={submitting}>
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
        <form onSubmit={handleSubmitStage(onSubmitStage)} className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-1.5 block">Stage Name</label>
            <Input {...registerStage("name", { required: "Name is required" })} placeholder="Beginner" className="h-9 text-sm" />
            {errorsStage.name && <p className="text-destructive text-xs mt-1">{errorsStage.name.message}</p>}
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block">Sort Order</label>
            <Input 
              type="number" 
              {...registerStage("sortOrder", { required: "Order is required", valueAsNumber: true, min: 1 })} 
              placeholder="1"
              className="h-9 text-sm"
            />
            {errorsStage.sortOrder && <p className="text-destructive text-xs mt-1">{errorsStage.sortOrder.message}</p>}
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block">Difficulty Label (Optional)</label>
            <Input {...registerStage("difficultyLabel")} placeholder="Easy" className="h-9 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="stage-active"
              {...registerStage("active")}
              className="h-3.5 w-3.5 rounded border-border"
            />
            <label htmlFor="stage-active" className="text-xs font-medium cursor-pointer">
              Active (visible to users)
            </label>
          </div>
          <Button type="submit" variant="gradient" className="w-full justify-center h-9 text-sm" disabled={submitting}>
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
        <form onSubmit={handleSubmitPrize(onSubmitPrize)} className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-1.5 block">Stage Name</label>
            <select 
              {...registerPrize("stageName", { required: "Stage is required" })}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl h-9 text-sm"
            >
              <option value="">Select a stage</option>
              {stages.filter(s => s.active).map(stage => (
                <option key={stage.id} value={stage.name}>{stage.name}</option>
              ))}
            </select>
            {errorsPrize.stageName && <p className="text-destructive text-xs mt-1">{errorsPrize.stageName.message}</p>}
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block">Period</label>
            <select 
              {...registerPrize("period", { required: "Period is required" })}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl h-9 text-sm"
            >
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
            {errorsPrize.period && <p className="text-destructive text-xs mt-1">{errorsPrize.period.message}</p>}
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block">Description</label>
            <Input {...registerPrize("description", { required: "Description is required" })} placeholder="Top performer prize for this stage" className="h-9 text-sm" />
            {errorsPrize.description && <p className="text-destructive text-xs mt-1">{errorsPrize.description.message}</p>}
          </div>
          <Button type="submit" variant="gradient" className="w-full justify-center h-9 text-sm" disabled={submitting}>
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
        <form onSubmit={handleSubmitQuestion(onSubmitQuestion)} className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className="text-xs font-medium mb-1.5 block">Question Text</label>
            <textarea 
              {...registerQuestion("questionText", { required: "Question is required" })}
              placeholder="Who directed The Dark Knight?"
              className="w-full px-3 py-2 bg-background border border-border rounded-xl min-h-[70px] text-sm"
            />
            {errorsQuestion.questionText && <p className="text-destructive text-xs mt-1">{errorsQuestion.questionText.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium mb-1.5 block">Option A</label>
              <Input {...registerQuestion("optionA", { required: "Required" })} placeholder="First option" className="h-9 text-sm" />
              {errorsQuestion.optionA && <p className="text-destructive text-xs mt-1">{errorsQuestion.optionA.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block">Option B</label>
              <Input {...registerQuestion("optionB", { required: "Required" })} placeholder="Second option" className="h-9 text-sm" />
              {errorsQuestion.optionB && <p className="text-destructive text-xs mt-1">{errorsQuestion.optionB.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block">Option C</label>
              <Input {...registerQuestion("optionC", { required: "Required" })} placeholder="Third option" className="h-9 text-sm" />
              {errorsQuestion.optionC && <p className="text-destructive text-xs mt-1">{errorsQuestion.optionC.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block">Option D</label>
              <Input {...registerQuestion("optionD", { required: "Required" })} placeholder="Fourth option" className="h-9 text-sm" />
              {errorsQuestion.optionD && <p className="text-destructive text-xs mt-1">{errorsQuestion.optionD.message}</p>}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block">Correct Option</label>
            <select 
              {...registerQuestion("correctOption", { required: "Correct option is required" })}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl h-9 text-sm"
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
            {errorsQuestion.correctOption && <p className="text-destructive text-xs mt-1">{errorsQuestion.correctOption.message}</p>}
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block">Stage</label>
            <select 
              {...registerQuestion("stageName", { required: "Stage is required" })}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl h-9 text-sm"
            >
              <option value="">Select a stage</option>
              {stages.filter(s => s.active).map(stage => (
                <option key={stage.id} value={stage.name}>{stage.name}</option>
              ))}
            </select>
            {errorsQuestion.stageName && <p className="text-destructive text-xs mt-1">{errorsQuestion.stageName.message}</p>}
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block">Category</label>
            <select 
              {...registerQuestion("categoryName", { required: "Category is required" })}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl h-9 text-sm"
            >
              <option value="">Select a category</option>
              {categories.filter(c => c.active).map(category => (
                <option key={category.id} value={category.name}>{category.name}</option>
              ))}
            </select>
            {errorsQuestion.categoryName && <p className="text-destructive text-xs mt-1">{errorsQuestion.categoryName.message}</p>}
          </div>
          <Button type="submit" variant="gradient" className="w-full justify-center h-9 text-sm" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit for Approval"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
