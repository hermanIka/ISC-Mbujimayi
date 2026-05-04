import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetEvaluationById, useSubmitEvaluation, getGetEvaluationByIdQueryKey } from "@workspace/api-client-react";
import { useRoute, useLocation } from "@/lib/router";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function TakeEvaluationPage() {
  const [, params] = useRoute("/evaluations/:id");
  const evaluationId = params?.id || "";
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [answers, setAnswers] = useState<Record<string, string>>({});

  const { data: evaluation, isLoading } = useGetEvaluationById(evaluationId, {
    query: { enabled: !!evaluationId, queryKey: getGetEvaluationByIdQueryKey(evaluationId) }
  });

  const submitEval = useSubmitEvaluation();

  const handleSubmit = async () => {
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));

      await submitEval.mutateAsync({ id: evaluationId, data: { answers: formattedAnswers } });
      toast({ title: "Évaluation soumise", description: "Vos réponses ont été enregistrées avec succès." });
      if (evaluation?.courseId) {
        setLocation(`/courses/${evaluation.courseId}/learn`);
      } else {
        setLocation("/dashboard/student");
      }
    } catch {
      toast({ title: "Erreur", description: "Impossible de soumettre l'évaluation", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto p-8 space-y-6">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!evaluation) {
    return <AppLayout><div className="p-8 text-center">Évaluation introuvable</div></AppLayout>;
  }

  const questions = evaluation.questions ?? [];

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{evaluation.title}</h1>
          <p className="text-muted-foreground mt-2">Durée: {evaluation.duration} minutes • Note de passage: {evaluation.passMark}%</p>
        </div>

        <div className="space-y-8">
          {questions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/10">
              Aucune question disponible pour cette évaluation.
            </div>
          ) : (
            questions.map((q, idx) => (
              <Card key={q.id ?? idx}>
                <CardHeader>
                  <CardTitle className="text-lg flex justify-between">
                    <span>{idx + 1}. {q.text}</span>
                    <span className="text-sm font-normal text-muted-foreground">{q.points} pts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {q.options && q.options.length > 0 ? (
                    <RadioGroup
                      onValueChange={(val) => setAnswers(prev => ({ ...prev, [q.id]: val }))}
                      value={answers[q.id]}
                      className="space-y-3"
                    >
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50">
                          <RadioGroupItem value={opt.text} id={`q${idx}-opt${optIdx}`} />
                          <Label htmlFor={`q${idx}-opt${optIdx}`} className="flex-1 cursor-pointer">{opt.text}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <Textarea
                      placeholder="Saisissez votre réponse ici..."
                      rows={5}
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    />
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button size="lg" onClick={handleSubmit} disabled={submitEval.isPending}>
            {submitEval.isPending ? "Soumission..." : "Soumettre l'évaluation"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
