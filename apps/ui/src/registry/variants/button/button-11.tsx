// @ts-nocheck
import { Briefcase, Globe, Star } from "lucide-react"
import { Button } from "@/components/ui/button"

const SocialButtonDemo = () => {
  return (
    <div className="flex items-center gap-2">
      <Button className="rounded-full" size="icon">
        <Star />
      </Button>
      <Button className="rounded-full" size="icon">
        <Globe />
      </Button>
      <Button className="rounded-full" size="icon">
        <Briefcase />
      </Button>
    </div>
  )
}

export default SocialButtonDemo
