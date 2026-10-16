import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTelegramAccount,
  requestTelegramCode,
  verifyTelegramCode,
  verifyTelegramPassword,
  disconnectTelegramAccount,
  refreshTelegramDialogs,
  listTelegramDialogs,
  linkTelegramDialog
} from "./chat.telegram.services";

export function useChatTelegram() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ["chat", "telegram"] });
  return {
    account: useQuery({
      queryKey: ["chat", "telegram", "account"],
      queryFn: getTelegramAccount,
      refetchInterval: 2000
    }),
    sendCode: useMutation({ mutationFn: requestTelegramCode, onSuccess: invalidate }),
    verifyCode: useMutation({ mutationFn: verifyTelegramCode, onSuccess: invalidate }),
    verifyPassword: useMutation({ mutationFn: verifyTelegramPassword, onSuccess: invalidate }),
    disconnect: useMutation({ mutationFn: disconnectTelegramAccount, onSuccess: invalidate }),
    refresh: useMutation({ mutationFn: refreshTelegramDialogs, onSuccess: invalidate }),
    link: useMutation({
      mutationFn: (input: { dialogUuid: string; channelUuid: string | null }) =>
        linkTelegramDialog(input.dialogUuid, input.channelUuid),
      onSuccess: invalidate
    })
  };
}
export function useTelegramDialogs(enabled: boolean) {
  return useQuery({
    queryKey: ["chat", "telegram", "dialogs"],
    queryFn: listTelegramDialogs,
    enabled,
    refetchInterval: enabled ? 15_000 : false
  });
}
