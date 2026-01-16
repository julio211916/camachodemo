import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { NewHeader } from "@/components/NewHeader";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Calendar, User, ArrowRight, Tag, Search, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";
import { fadeInUp, staggerContainer } from "@/hooks/useAnimations";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

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

const Blog = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;
    const query = searchQuery.toLowerCase();
    return posts.filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        post.excerpt?.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [posts, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <NewHeader />
      
      <main className="pt-32 pb-20">
        <div className="container-wide">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.span
              variants={fadeInUp}
              className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4"
            >
              Nuestro Blog
            </motion.span>
            <motion.h1
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4"
            >
              Artículos sobre Salud Dental
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              Consejos, novedades y todo lo que necesitas saber para mantener tu sonrisa saludable
            </motion.p>

            {/* Search Bar */}
            <motion.div variants={fadeInUp} className="mt-8 max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar artículos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 h-12 rounded-full bg-card border-border"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {searchQuery && (
                <p className="text-sm text-muted-foreground mt-2">
                  {filteredPosts.length} resultado{filteredPosts.length !== 1 ? "s" : ""} para "{searchQuery}"
                </p>
              )}
            </motion.div>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted h-48 rounded-xl mb-4" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                {searchQuery
                  ? "No se encontraron artículos con esa búsqueda"
                  : "Próximamente publicaremos artículos interesantes. ¡Vuelve pronto!"}
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setSearchQuery("")}
                >
                  Ver todos los artículos
                </Button>
              )}
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredPosts.map((post, index) => (
                <motion.article
                  key={post.id}
                  variants={fadeInUp}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group bg-card rounded-2xl overflow-hidden shadow-lg border border-border"
                >
                  <Link to={`/blog/${post.slug}`}>
                    <div className="relative h-48 overflow-hidden">
                      {post.cover_image ? (
                        <img
                          src={post.cover_image}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <span className="text-6xl">🦷</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="p-6">
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {post.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                            >
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <h2 className="text-xl font-serif font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          {post.author_name && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {post.author_name}
                            </span>
                          )}
                          {post.published_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(post.published_at), "d MMM yyyy", { locale: es })}
                            </span>
                          )}
                        </div>
                        <span className="flex items-center gap-1 text-primary font-medium group-hover:translate-x-1 transition-transform">
                          Leer más
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Blog;
