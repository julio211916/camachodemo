import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { NewHeader } from "@/components/NewHeader";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Calendar, User, ArrowLeft, Tag, Share2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { fadeInUp } from "@/hooks/useAnimations";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  author_name: string | null;
  published_at: string | null;
  tags: string[] | null;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();
      if (error) throw error;
      return data as BlogPost;
    },
    enabled: !!slug,
  });

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: post?.title,
        text: post?.excerpt || "",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NewHeader />
        <main className="pt-32 pb-20">
          <div className="container-wide max-w-4xl">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/4 mb-4" />
              <div className="h-12 bg-muted rounded w-3/4 mb-6" />
              <div className="h-64 bg-muted rounded-xl mb-8" />
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-5/6" />
                <div className="h-4 bg-muted rounded w-4/6" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <NewHeader />
        <main className="pt-32 pb-20">
          <div className="container-wide text-center">
            <h1 className="text-3xl font-bold mb-4">Artículo no encontrado</h1>
            <p className="text-muted-foreground mb-8">
              El artículo que buscas no existe o ha sido eliminado.
            </p>
            <Button asChild>
              <Link to="/blog">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al blog
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NewHeader />
      
      <main className="pt-32 pb-20">
        <article className="container-wide max-w-4xl">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
          >
            {/* Back link */}
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al blog
            </Link>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex items-center justify-between flex-wrap gap-4 pb-8 border-b border-border mb-8">
              <div className="flex items-center gap-6 text-muted-foreground">
                {post.author_name && (
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {post.author_name}
                  </span>
                )}
                {post.published_at && (
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(post.published_at), "d 'de' MMMM, yyyy", { locale: es })}
                  </span>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Compartir
              </Button>
            </div>

            {/* Cover image */}
            {post.cover_image && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-10"
              >
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="w-full h-auto rounded-2xl shadow-lg"
                />
              </motion.div>
            )}

            {/* Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none">
              {post.content.split("\n").map((paragraph, idx) => (
                <p key={idx} className="mb-4 text-foreground/90 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-16 p-8 bg-primary/5 rounded-2xl text-center">
              <h3 className="text-2xl font-serif font-bold mb-4">
                ¿Tienes dudas sobre tu salud dental?
              </h3>
              <p className="text-muted-foreground mb-6">
                Agenda una cita con nuestros especialistas y resuelve todas tus preguntas.
              </p>
              <Button asChild size="lg">
                <a href="/#reservar">Agendar Cita</a>
              </Button>
            </div>
          </motion.div>
        </article>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default BlogPost;
