"use client";

import Link from "next/link";

import {
  Loader2,
  MessageCircle,
  Send,
  Trash2,
} from "lucide-react";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

type ActivityComment = {
  id: string;
  activity_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

type CommentProfile = {
  id: string;
  username: string | null;
  display_name: string | null;
};

interface ActivityCommentsProps {
  activityId: string;
  currentUserId: string;
}

function formatCommentDate(
  dateString: string
) {
  const date =
    new Date(dateString);

  const now =
    new Date();

  const difference =
    now.getTime() -
    date.getTime();

  const minutes =
    Math.floor(
      difference /
        (1000 * 60)
    );

  const hours =
    Math.floor(
      difference /
        (1000 * 60 * 60)
    );

  if (minutes < 1) {
    return "Ahora";
  }

  if (minutes < 60) {
    return `Hace ${minutes} min`;
  }

  if (hours < 24) {
    return hours === 1
      ? "Hace 1 h"
      : `Hace ${hours} h`;
  }

  return new Intl.DateTimeFormat(
    "es-MX",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

export default function ActivityComments({
  activityId,
  currentUserId,
}: ActivityCommentsProps) {
  const [supabase] =
    useState(() =>
      createClient()
    );

  const [
    comments,
    setComments,
  ] =
    useState<ActivityComment[]>([]);

  const [
    commentCount,
    setCommentCount,
  ] =
    useState(0);

  const [
    profiles,
    setProfiles,
  ] =
    useState<CommentProfile[]>([]);

  const [
    content,
    setContent,
  ] =
    useState("");

  const [
    open,
    setOpen,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    sending,
    setSending,
  ] =
    useState(false);

  const [
    deletingId,
    setDeletingId,
  ] =
    useState<string | null>(
      null
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const profilesById =
    useMemo(
      () =>
        new Map(
          profiles.map(
            (profile) => [
              profile.id,
              profile,
            ]
          )
        ),
      [profiles]
    );

  /* COMMENT COUNT */

  const loadCommentCount =
    useCallback(async () => {
      const {
        count,
        error,
      } =
        await supabase
          .from(
            "activity_comments"
          )
          .select(
            "id",
            {
              count: "exact",
              head: true,
            }
          )
          .eq(
            "activity_id",
            activityId
          );

      if (error) {
        console.error(
          "Error loading activity comment count:",
          error
        );

        return;
      }

      setCommentCount(
        count ?? 0
      );
    }, [
      activityId,
      supabase,
    ]);

  useEffect(() => {
    const timeout =
      window.setTimeout(
        () => {
          void loadCommentCount();
        },
        0
      );

    return () => {
      window.clearTimeout(
        timeout
      );
    };
  }, [
    loadCommentCount,
  ]);

  /* LOAD COMMENTS */

  const loadComments =
    useCallback(async () => {
      setLoading(true);
      setErrorMessage("");

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "activity_comments"
          )
          .select(`
            id,
            activity_id,
            user_id,
            content,
            created_at
          `)
          .eq(
            "activity_id",
            activityId
          )
          .order(
            "created_at",
            {
              ascending: true,
            }
          );

      if (error) {
        console.error(
          "Error loading activity comments:",
          error
        );

        setErrorMessage(
          "No se pudieron cargar los comentarios."
        );

        setLoading(false);
        return;
      }

      const loadedComments =
        (data ??
          []) as ActivityComment[];

      setComments(
        loadedComments
      );

      setCommentCount(
        loadedComments.length
      );

      const userIds = [
        ...new Set(
          loadedComments.map(
            (comment) =>
              comment.user_id
          )
        ),
      ];

      if (
        userIds.length === 0
      ) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      const {
        data:
          profileData,
        error:
          profileError,
      } =
        await supabase
          .from("profiles")
          .select(`
            id,
            username,
            display_name
          `)
          .in(
            "id",
            userIds
          );

      if (profileError) {
        console.error(
          "Error loading comment profiles:",
          profileError
        );

        setErrorMessage(
          "No se pudieron cargar algunos usuarios."
        );

        setLoading(false);
        return;
      }

      setProfiles(
        (profileData ??
          []) as CommentProfile[]
      );

      setLoading(false);
    }, [
      activityId,
      supabase,
    ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeout =
      window.setTimeout(
        () => {
          void loadComments();
        },
        0
      );

    return () => {
      window.clearTimeout(
        timeout
      );
    };
  }, [
    open,
    loadComments,
  ]);

  /* CREATE COMMENT */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (sending) {
      return;
    }

    const cleanContent =
      content.trim();

    if (!cleanContent) {
      return;
    }

    if (
      cleanContent.length >
      1000
    ) {
      setErrorMessage(
        "El comentario no puede superar los 1000 caracteres."
      );

      return;
    }

    setSending(true);
    setErrorMessage("");

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "activity_comments"
        )
        .insert({
          activity_id:
            activityId,

          user_id:
            currentUserId,

          content:
            cleanContent,
        })
        .select(`
          id,
          activity_id,
          user_id,
          content,
          created_at
        `)
        .single();

    if (error) {
      console.error(
        "Error creating activity comment:",
        error
      );

      setErrorMessage(
        "No se pudo publicar el comentario."
      );

      setSending(false);
      return;
    }

    const newComment =
      data as ActivityComment;

    setComments(
      (current) => [
        ...current,
        newComment,
      ]
    );

    setCommentCount(
      (current) =>
        current + 1
    );

    if (
      !profiles.some(
        (profile) =>
          profile.id ===
          currentUserId
      )
    ) {
      const {
        data:
          profile,
        error:
          profileError,
      } =
        await supabase
          .from("profiles")
          .select(`
            id,
            username,
            display_name
          `)
          .eq(
            "id",
            currentUserId
          )
          .maybeSingle();

      if (profileError) {
        console.error(
          "Error loading current comment profile:",
          profileError
        );
      }

      if (profile) {
        setProfiles(
          (current) => [
            ...current,
            profile as CommentProfile,
          ]
        );
      }
    }

    setContent("");
    setSending(false);
  }

  /* DELETE COMMENT */

  async function deleteComment(
    commentId: string
  ) {
    if (deletingId) {
      return;
    }

    setDeletingId(
      commentId
    );

    setErrorMessage("");

    const {
      error,
    } =
      await supabase
        .from(
          "activity_comments"
        )
        .delete()
        .eq(
          "id",
          commentId
        )
        .eq(
          "user_id",
          currentUserId
        );

    if (error) {
      console.error(
        "Error deleting activity comment:",
        error
      );

      setErrorMessage(
        "No se pudo eliminar el comentario."
      );

      setDeletingId(null);
      return;
    }

    setComments(
      (current) =>
        current.filter(
          (comment) =>
            comment.id !==
            commentId
        )
    );

    setCommentCount(
      (current) =>
        Math.max(
          0,
          current - 1
        )
    );

    setDeletingId(null);
  }

  return (
    <div className="mt-3">
      {/* COMMENTS BUTTON */}

      <button
        type="button"
        onClick={() =>
          setOpen(
            (current) =>
              !current
          )
        }
        aria-expanded={
          open
        }
        className="flex items-center gap-2 text-sm text-zinc-500 transition hover:text-zinc-300"
      >
        <MessageCircle
          size={18}
        />

        <span>
          Comentarios
        </span>

        {commentCount > 0 && (
          <span>
            {commentCount}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
          {/* NEW COMMENT */}

          <form
            onSubmit={
              handleSubmit
            }
            className="flex gap-3"
          >
            <input
              type="text"
              value={
                content
              }
              onChange={(
                event
              ) =>
                setContent(
                  event.target.value
                )
              }
              maxLength={1000}
              placeholder="Escribe un comentario..."
              className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-fuchsia-500"
            />

            <button
              type="submit"
              disabled={
                sending ||
                !content.trim()
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500 text-white transition hover:bg-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Publicar comentario"
            >
              {sending ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Send
                  size={17}
                />
              )}
            </button>
          </form>

          {/* ERROR */}

          {errorMessage && (
            <p className="mt-3 text-sm text-red-400">
              {
                errorMessage
              }
            </p>
          )}

          {/* COMMENTS */}

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2
                size={22}
                className="animate-spin text-zinc-600"
              />
            </div>
          ) : comments.length ===
            0 ? (
            <p className="py-6 text-center text-sm text-zinc-600">
              Todavía no hay comentarios.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {comments.map(
                (comment) => {
                  const profile =
                    profilesById.get(
                      comment.user_id
                    );

                  const displayName =
                    profile?.display_name ??
                    profile?.username ??
                    "Usuario";

                  const profileHref =
                    profile?.username
                      ? `/profile/${encodeURIComponent(
                          profile.username
                        )}`
                      : null;

                  const isOwner =
                    comment.user_id ===
                    currentUserId;

                  return (
                    <div
                      key={
                        comment.id
                      }
                      className="flex gap-3 border-t border-zinc-800/70 pt-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {profileHref ? (
                            <Link
                              href={
                                profileHref
                              }
                              className="text-sm font-semibold text-zinc-200 transition hover:text-fuchsia-300"
                            >
                              {
                                displayName
                              }
                            </Link>
                          ) : (
                            <span className="text-sm font-semibold text-zinc-200">
                              {
                                displayName
                              }
                            </span>
                          )}

                          <span className="text-xs text-zinc-600">
                            {formatCommentDate(
                              comment.created_at
                            )}
                          </span>
                        </div>

                        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-400">
                          {
                            comment.content
                          }
                        </p>
                      </div>

                      {isOwner && (
                        <button
                          type="button"
                          onClick={() =>
                            deleteComment(
                              comment.id
                            )
                          }
                          disabled={
                            deletingId ===
                            comment.id
                          }
                          className="self-start rounded-lg p-2 text-zinc-600 transition hover:bg-zinc-800 hover:text-red-400 disabled:opacity-50"
                          aria-label="Eliminar comentario"
                        >
                          {deletingId ===
                          comment.id ? (
                            <Loader2
                              size={15}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2
                              size={15}
                            />
                          )}
                        </button>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}