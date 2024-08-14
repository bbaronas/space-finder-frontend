import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { AuthService } from "./AuthService";
import { DataStack, ApiStack } from "../../../space-finder/outputs.json";
import { SpaceEntry } from "../components/model/model";

const spacesUrl = ApiStack.SpacesApiEndpoint36C4F3B6 + 'spaces'


export class DataService {

    private authService: AuthService;
    private s3Client: S3Client | undefined;
    private awsRegion = 'us-east-1';

    constructor(authService: AuthService) {
        this.authService = authService;
    }

    public reserveSpace(spaceId: string) {
        return '123';
    }

    public async getSpaces(): Promise<SpaceEntry[]> {
        const getSpacesResult = await fetch(spacesUrl, {
            method: 'GET',
            headers: {
                'Authorization': this.authService.jwtToken!,
            }
        });
        const getSpacesResultJSON = await getSpacesResult.json();
        return getSpacesResultJSON;
    }

    public async createSpace(name: string, location:string, photo?: File) {
        const space = {} as any;
        space.name = name;
        space.location = location;
        if (photo) {
            const uploadUrl = await this.uploadPublicFile(photo)
            space.photoUrl = uploadUrl;
        };
        const postResult = await fetch(spacesUrl, {
            method: 'POST',
            headers: {
                'Authorization': this.authService.jwtToken!,
            },
            body: JSON.stringify(space)
        });

        const postResultJSON = await postResult.json();
        return postResultJSON.id;
    }

    private async uploadPublicFile(file: File) {
        const credentials = await this.authService.getTemporaryCredentials();
        if (!this.s3Client) {
            this.s3Client = new S3Client({
                credentials,
                region: this.awsRegion
            });
        }
        const command = new PutObjectCommand({
            Bucket: DataStack.SpaceFinderPhotosBucketName,
            Key: file.name,
            ACL: 'public-read',
            Body: file
        })
        await this.s3Client.send(command);
        return `https://${command.input.Bucket}.s3.${this.awsRegion}.amazonaws.com/${command.input.Key}`;
    }

    public isAuthorized() {
        return this.authService.isAuthorized();
    }
}
