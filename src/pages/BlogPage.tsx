import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Icon from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, BlogPost } from "@/lib/api";

const TAGS = ["Все", "Призвание", "Советы", "Истории"];

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTag, setActiveTag] = useState("Все");
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api.blog.list(activeTag === "Все" ? undefined : activeTag)
      .then(d => setPosts(d.posts))
      .finally(() => setLoading(false));
  }, [activeTag]);

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
    } catch { return s; }
  };

  return (
    <Layout>
      <div className="bg-gradient-to-br from-cream to-light-sage/20 py-16 border-b border-border">
        <div className="container max-w-6xl mx-auto px-4">
          <p className="text-sm text-sage mb-2 tracking-widest uppercase">Материалы</p>
          <h1 className="font-display text-5xl font-light text-warm-brown mb-3">Блог</h1>
          <p className="text-muted-foreground max-w-xl">Статьи о призвании, служении и христианском взгляде на профессиональную жизнь.</p>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-10">
        {/* Tag filter */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {TAGS.map(tag => (
            <Button
              key={tag}
              variant={activeTag === tag ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTag(tag)}
              className={activeTag === tag ? "bg-warm-brown text-primary-foreground" : "border-border text-muted-foreground hover:border-warm-brown hover:text-warm-brown"}
            >
              {tag}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20"><Icon name="Loader" size={32} className="mx-auto opacity-30 animate-spin" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Icon name="BookOpen" size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-display text-2xl">Статей пока нет</p>
          </div>
        ) : (
          <>
            {/* Featured first post */}
            {posts[0] && (
              <article
                onClick={() => navigate(`/blog/${posts[0].slug}`)}
                className="group cursor-pointer bg-card border border-border rounded-2xl overflow-hidden mb-8 hover:shadow-lg transition-all"
              >
                <div className="md:grid md:grid-cols-2">
                  <div className="bg-gradient-to-br from-sage/20 via-cream to-gold/10 aspect-video md:aspect-auto flex items-center justify-center relative overflow-hidden">
                    <span className="font-display text-[120px] text-warm-brown/10 select-none">✝</span>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />
                  </div>
                  <div className="p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                      <Badge variant="outline" className="text-xs border-sage/40 text-sage">{posts[0].tag}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(posts[0].created_at)}</span>
                    </div>
                    <h2 className="font-display text-3xl font-semibold text-foreground mb-3 group-hover:text-warm-brown transition-colors leading-tight">{posts[0].title}</h2>
                    <p className="text-muted-foreground leading-relaxed mb-5">{posts[0].excerpt}</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center">
                        <Icon name="User" size={14} className="text-sage" />
                      </div>
                      <span className="text-sm text-muted-foreground">{posts[0].author}</span>
                    </div>
                  </div>
                </div>
              </article>
            )}

            {/* Rest of posts */}
            <div className="grid md:grid-cols-3 gap-6">
              {posts.slice(1).map(post => (
                <article key={post.id} onClick={() => navigate(`/blog/${post.slug}`)} className="group cursor-pointer">
                  <div className="bg-cream rounded-xl aspect-video mb-4 flex items-center justify-center border border-border overflow-hidden relative group-hover:shadow-md transition-shadow">
                    <div className="absolute inset-0 bg-gradient-to-br from-sage/20 to-gold/10" />
                    <span className="font-display text-5xl text-warm-brown/20 relative z-10">✝</span>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className="text-xs border-sage/40 text-sage">{post.tag}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(post.created_at)}</span>
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2 group-hover:text-warm-brown transition-colors leading-tight">{post.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{post.excerpt}</p>
                  <span className="mt-3 text-sm text-warm-brown font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    Читать <Icon name="ArrowRight" size={14} />
                  </span>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
