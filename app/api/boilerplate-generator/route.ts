import { NextRequest, NextResponse } from 'next/server';



export async function GET(req: NextRequest) {
  return NextResponse.json({ message: 'API is alive 🚀' });
}

export async function POST(req: NextRequest) {
  try {
    const {
      provider,
      projectName,
      visibility,
      namespace,
      ghTemplateOwner,
      ghTemplateRepo,
      glTemplatesGroupId,
      glTemplateProjectId,
    } = await req.json();

    if (!provider || !projectName || !namespace) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // ---------- GitHub ----------
    if (provider === 'github') {
      const token = process.env.GITHUB_TOKEN!;
      const templateOwner = ghTemplateOwner || process.env.GH_TEMPLATE_OWNER!;
      const templateRepo = ghTemplateRepo || process.env.GH_TEMPLATE_REPO!;
      const privateFlag = visibility !== 'public';

      const ghRes = await fetch(
        `https://api.github.com/repos/${templateOwner}/${templateRepo}/generate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            owner: namespace, // destination org/user
            name: projectName,
            private: privateFlag,
            include_all_branches: false,
          }),
        }
      );

      const ghData = await ghRes.json();
      if (!ghRes.ok) {
        return NextResponse.json({ message: ghData?.message || 'GitHub error', details: ghData }, { status: ghRes.status });
      }

      return NextResponse.json({ webUrl: ghData.html_url }, { status: 201 });
    }

    // ---------- GitLab ----------
    if (provider === 'gitlab') {
      const token = process.env.GITLAB_TOKEN!;
      const base = process.env.GITLAB_BASE_URL || 'https://gitlab.com';

      const body: Record<string, any> = {
        name: projectName,
        namespace_id: Number(namespace),
        visibility: visibility || 'private',
        use_custom_template: true,
      };

      if (glTemplatesGroupId) body.group_with_project_templates_id = Number(glTemplatesGroupId);
      if (glTemplateProjectId) body.template_project_id = Number(glTemplateProjectId);

      const glRes = await fetch(`${base}/api/v4/projects`, {
        method: 'POST',
        headers: {
          'PRIVATE-TOKEN': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const glData = await glRes.json();
      if (!glRes.ok) {
        return NextResponse.json({ message: glData?.message || 'GitLab error', details: glData }, { status: glRes.status });
      }

      return NextResponse.json({ webUrl: glData.web_url }, { status: 201 });
    }

    return NextResponse.json({ message: 'Unknown provider' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || 'Server error' }, { status: 500 });
  }
}
