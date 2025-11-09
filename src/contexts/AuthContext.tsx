import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: "admin" | "operador" | null;
  userName: string;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nome: string, role: "admin" | "operador") => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] =useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<"admin" | "operador" | null>(null);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setUserName("");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("nome")
        .eq("id", userId)
        .single();

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (profile) setUserName(profile.nome);
      if (roleData) setUserRole(roleData.role as "admin" | "operador");
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao sistema MEMO.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // --- FUNÇÃO SIGNUP CORRIGIDA COM "UPSERT" ---
  const signUp = async (email: string, password: string, nome: string, role: "admin" | "operador") => {
    try {
      // 1. Criar o usuário na auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error("Erro ao criar usuário");

      // 2. Usar "UPSERT" no perfil
      // Isso irá INSERIR se for novo, ou ATUALIZAR se já existir (por trigger/banco sujo)
      // Resolvendo o erro "duplicate key"
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: data.user.id, // O 'id' para bater
          nome: nome,       // O 'nome' para atualizar/inserir
          email: email      // O 'email' para atualizar/inserir
        });

      if (profileError) throw profileError; 

      // 3. Inserir a 'role'
      // Isso deve funcionar agora que o 'profiles' com certeza existe
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: data.user.id,
          role: role,
        });

      if (roleError) throw roleError;

      // --- FIM DA CORREÇÃO ---

      toast({
        title: "Cadastro realizado!",
        description: "Você já pode fazer login no sistema.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao fazer logout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, session, userRole, userName, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};