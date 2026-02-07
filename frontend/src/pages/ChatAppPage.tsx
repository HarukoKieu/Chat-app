import Logout from "@/components/auth/Logout";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";

const ChatAppPage = () => {
  const user = useAuthStore((state) => state.user);

  const handleOnClick = async () => {
    try {
      await api.get("/users/test", { withCredentials: true });
      toast.success("success");
    } catch (error) {
      toast.error("failed");
      console.error(error);
    }
  };
  return (
    <div>
      {user?.username}
      <Logout />
      <Button onClick={handleOnClick}>test</Button>
    </div>
  );
};

export default ChatAppPage;
