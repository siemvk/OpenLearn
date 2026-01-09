import Link from "next/link";

interface CreatorLinkProps {
  creator: string;
  userId?: string | null;
  displayName?: string | null;
  bold?: boolean;
}

// UUID validation regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function CreatorLink({ creator, userId, displayName, bold = false }: CreatorLinkProps) {
  // Determine the link target
  let linkTarget: string;

  if (userId) {
    // If we have a userId, use it directly
    linkTarget = userId;
  } else if (UUID_REGEX.test(creator)) {
    // If creator is already a UUID, use it
    linkTarget = creator;
  } else {
    // If creator is a name and we don't have userId, fallback to name
    // This should be avoided in favor of providing userId
    linkTarget = creator;
  }

  // Determine display text
  const displayText = displayName || creator;

  return (
    <Link
      href={`/home/viewuser/${linkTarget}`}
      className={`text-blue-400 hover:underline transition-colors cursor-pointer ${bold ? 'font-bold' : ''}`}
    >
      {displayText}
    </Link>
  );
}
