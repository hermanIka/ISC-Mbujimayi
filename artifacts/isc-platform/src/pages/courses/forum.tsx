import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListForumPosts, useCreateForumPost, getListForumPostsQueryKey } from "@workspace/api-client-react";
import { useRoute, Link } from "@/lib/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send } from "lucide-react";
import { format } from "date-fns";

export default function CourseForumPage() {
  const [, params] = useRoute("/courses/:id/forum");
  const courseId = params?.id || "";
  const [content, setContent] = useState("");
  const { toast } = useToast();

  const { data: forumData, isLoading, refetch } = useListForumPosts(courseId, undefined, {
    query: { enabled: !!courseId, queryKey: getListForumPostsQueryKey(courseId) }
  });

  const createPost = useCreateForumPost();

  const handleSubmit = async () => {
    if (!content.trim()) return;
    try {
      await createPost.mutateAsync({ courseId, data: { content } });
      setContent("");
      refetch();
      toast({ title: "Message publié" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de publier", variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-8 space-y-6">
        <Button variant="ghost" asChild className="-ml-4">
          <Link href={`/courses/${courseId}/learn`}><ArrowLeft className="mr-2 h-4 w-4" /> Retour au cours</Link>
        </Button>

        <h1 className="text-3xl font-bold tracking-tight">Forum de discussion</h1>

        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Avatar>
                <AvatarFallback>M</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea 
                  placeholder="Posez une question ou partagez une réflexion..." 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-end">
                  <Button onClick={handleSubmit} disabled={!content.trim() || createPost.isPending}>
                    <Send className="mr-2 h-4 w-4" /> {createPost.isPending ? "Envoi..." : "Publier"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
            ))
          ) : !forumData?.posts || forumData.posts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">Aucun message pour le moment. Soyez le premier à lancer la discussion!</div>
          ) : (
            (forumData?.posts ?? []).map((post: any) => (
              <Card key={post.id}>
                <CardHeader className="pb-2 flex flex-row items-start gap-4 space-y-0">
                  <Avatar>
                    <AvatarFallback>{post.authorName?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">{post.authorName}</h3>
                      <span className="text-xs text-muted-foreground">Maintenant</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pl-16">
                  <p className="text-sm">{post.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
