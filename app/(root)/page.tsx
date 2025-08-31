import React from 'react'
import {Button} from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import {dummyInterviews} from "@/constants";
import InterviewCard from "@/components/InterviewCard";

const Page = () => {
    return (
        <>
          <section className="card-cta">
              <div className="flex flex-col gap-6 max-w-lg">
                <h2> Get Stressless form the Interviews with AI-Based Practise & Feedback</h2>
                  <p className="text-lg">
                      experience a real interview with AI & get intsant feedback and interview questions.
                  </p>
                  <Button asChild className="btn-primary max-sm:w-full">
                      <Link href="/interview">Start an Interview</Link>
                  </Button>
              </div>
              <Image src="/robot.png" alt="robo-dude" width={400} height={400}
              className="max-sm:hidden" />
          </section>
            <section className="flex flex-col gap-6 mt-8">
                <h2>Your interview</h2>
                <div className="interviews-section">
                    {dummyInterviews.map((interview) => (
                        <InterviewCard {...interview} key={interview.id} />
                    ))}
                    { /* <p>You haven&apos;t taken any interview yet</p>*/}
                </div>
            </section>
            <section className="flex flex-col gap-6 mt-8">
                <h2>Take an Interview</h2>
                <div className="interviews-section"></div>
                {dummyInterviews.map((interview) => (
                    <InterviewCard {...interview} key={interview.id} />
                ))}
            </section>
        </>
    )
}
export default Page
