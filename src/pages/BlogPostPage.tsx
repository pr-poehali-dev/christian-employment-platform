import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Icon from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, BlogPost } from "@/lib/api";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.blog.get(slug)
      .then(d => setPost(d.post))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const formatDate = (s: string) => {
    try { return new Date(s).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }); }
    catch { return s; }
  };

  // Simple markdown-ish renderer: ## headers, **bold**, paragraphs
  const renderContent = (text: string) => {
    return text.split("\n\n").map((block, i) => {
      if (block.startsWith("## ")) {
        return <h2 key={i} className="font-display text-2xl font-semibold text-warm-brown mt-8 mb-3">{block.replace("## ", "")}</h2>;
      }
      const parts = block.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={i} className="text-foreground leading-relaxed mb-4">
          {parts.map((part, j) =>
            part.startsWith("**") ? <strong key={j} className="font-semibold text-warm-brown">{part.replace(/\*\*/g, "")}</strong> : part
          )}
        </p>
      );
    });
  };

  return (
    <Layout>
      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Icon name="Loader" size={32} className="opacity-30 animate-spin" />
        </div>
      ) : notFound || !post ? (
        <div className="text-center py-32 text-muted-foreground">
          <Icon name="BookX" size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-display text-2xl mb-4">Статья не найдена</p>
          <Button onClick={() => navigate("/blog")} variant="outline" className="border-warm-brown text-warm-brown">
            Вернуться в блог
          </Button>
        </div>
      ) : (
        <>
          {/* Hero */}
          <div className="bg-gradient-to-br from-cream to-light-sage/20 py-16 border-b border-border">
            <div className="container max-w-3xl mx-auto px-4">
              <Button variant="ghost" onClick={() => navigate("/blog")} className="text-muted-foreground hover:text-warm-brown mb-6 -ml-2">
                <Icon name="ArrowLeft" size={16} className="mr-1" /> Все статьи
              </Button>
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="outline" className="border-sage/40 text-sage">{post.tag}</Badge>
                <span className="text-sm text-muted-foreground">{formatDate(post.created_at)}</span>
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-light text-warm-brown leading-tight mb-6">{post.title}</h1>
              {post.excerpt && <p className="text-lg text-muted-foreground leading-relaxed mb-6">{post.excerpt}</p>}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center">
                  <Icon name="User" size={16} className="text-sage" />
                </div>
                <div>
                  <p className="text-sm font-medium">{post.author}</p>
                  <p className="text-xs text-muted-foreground">Автор</p>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative banner */}
          <div className="bg-light-sage/15 border-b border-border">
            <div className="container max-w-3xl mx-auto px-4 py-8 flex items-center justify-center">
              <span className="font-display text-6xl text-warm-brown/15 select-none">✝</span>
            </div>
          </div>

          {/* Content */}
          <div className="container max-w-3xl mx-auto px-4 py-12">
            <div className="prose-content">
              {renderContent(post.content)}
            </div>

            <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <Button onClick={() => navigate("/blog")} variant="outline" className="border-warm-brown text-warm-brown hover:bg-warm-brown hover:text-primary-foreground">
                <Icon name="ArrowLeft" size={14} className="mr-1" /> Все статьи
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon name="Calendar" size={14} />
                Опубликовано: {formatDate(post.created_at)}
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
